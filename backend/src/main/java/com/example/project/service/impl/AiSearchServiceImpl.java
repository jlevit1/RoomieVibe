package com.example.project.service.impl;

import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import com.example.project.dto.response.AiSearchResponse;
import com.example.project.dto.response.LandmarkResponse;
import com.example.project.entity.Amenity;
import com.example.project.service.AiSearchService;
import com.example.project.service.GeocodingService;
import com.example.project.service.RoomListingService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import lombok.RequiredArgsConstructor;

/**
 * Turns a free-text Vietnamese room-search request ("tim phong duoi 3tr o
 * Cau Giay, co cho de xe") into the structured filters {@link RoomListingService#search}
 * already understands, by asking Gemini to extract them as JSON. This is the
 * one place in the app that calls a real generative-AI model - everything
 * else (recommendations, compatibility scoring) is hand-written rule-based logic.
 */
@Service
@RequiredArgsConstructor
public class AiSearchServiceImpl implements AiSearchService {

    private static final Logger log = LoggerFactory.getLogger(AiSearchServiceImpl.class);
    private static final int RESULT_LIMIT = 8;
    private static final double DEFAULT_RADIUS_KM = 3.0;
    private static final double MIN_RADIUS_KM = 0.3;
    private static final double MAX_RADIUS_KM = 20.0;
    // Possessive quantifiers + "start of a number" lookbehind keep this linear on long digit runs (public endpoint).
    private static final java.util.regex.Pattern EXPLICIT_DISTANCE = java.util.regex.Pattern.compile(
            "ban kinh|(?<!pho |duong |cau )di bo|sat vach|sat ben|ngay canh"
                    + "|(?<![\\d.,])\\d++(?:[.,]\\d++)?+\\s*+(?:km|m(?![a-z²2])|met(?! vuong)|cay so)");

    private static final List<String> KNOWN_CITIES = List.of(
            "Hà Nội", "TP. Hồ Chí Minh", "Đà Nẵng", "Cần Thơ", "Hải Phòng", "Bình Dương");

    // Every other Vietnamese province/city name we do NOT have listings for, plus a few
    // well-known city aliases (Nha Trang, Vung Tau, ...) people actually type instead of
    // the province name. Diacritic-stripped, lowercase - matched against the raw message.
    private static final List<String> UNSUPPORTED_LOCATIONS = List.of(
            "ha giang", "cao bang", "bac kan", "tuyen quang", "lao cai", "dien bien", "lai chau",
            "son la", "yen bai", "hoa binh", "thai nguyen", "lang son", "quang ninh", "ha long",
            "bac giang", "phu tho", "vinh phuc", "bac ninh", "hai duong", "hung yen", "thai binh",
            "ha nam", "nam dinh", "ninh binh", "thanh hoa", "nghe an", "vinh", "ha tinh",
            "quang binh", "quang tri", "hue", "quang nam", "hoi an", "quang ngai", "binh dinh",
            "quy nhon", "phu yen", "khanh hoa", "nha trang", "ninh thuan", "binh thuan", "phan thiet",
            "kon tum", "gia lai", "pleiku", "dak lak", "buon ma thuot", "dak nong", "lam dong",
            "da lat", "binh phuoc", "tay ninh", "dong nai", "bien hoa", "ba ria", "vung tau",
            "long an", "tien giang", "ben tre", "tra vinh", "vinh long", "dong thap", "an giang",
            "chau doc", "kien giang", "phu quoc", "hau giang", "soc trang", "bac lieu", "ca mau",
            "sa pa", "sapa");

    private final RoomListingService roomListingService;
    private final GeocodingService geocodingService;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Value("${gemini.api-key:}")
    private String apiKey;

    @Value("${gemini.model:gemini-3.5-flash-lite}")
    private String model;

    @Override
    public AiSearchResponse search(String message) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("AiSearchService: gemini.api-key chua duoc cau hinh");
            return AiSearchResponse.builder()
                    .reply("Trợ lý AI chưa được cấu hình (thiếu Gemini API key). Vui lòng thử tìm kiếm thủ công.")
                    .listings(List.of())
                    .build();
        }

        GeminiFilters filters;
        try {
            filters = extractFilters(message);
        } catch (Exception first) {
            // Free-tier Gemini models occasionally return a transient 503 ("high demand")
            // or a slow response that trips the timeout - one retry clears most of these
            // rather than failing the whole search over what's usually a momentary blip.
            log.warn("AiSearchService: goi Gemini lan 1 that bai, thu lai lan 2", first);
            try {
                filters = extractFilters(message);
            } catch (Exception second) {
                log.warn("AiSearchService: goi Gemini lan 2 cung that bai", second);
                return AiSearchResponse.builder()
                        .reply("Xin lỗi, trợ lý AI hiện không phản hồi được, vui lòng thử lại sau.")
                        .listings(List.of())
                        .build();
            }
        }

        sanitize(filters);

        String fallbackReply = filters.reply != null ? filters.reply : "Mình chỉ hỗ trợ tìm phòng trọ thôi nhé!";

        // The model itself flags messages that aren't a room search at all (greetings, small
        // talk, unrelated questions) - honor that before ever touching the search, otherwise
        // an off-topic message with no filters would search with nothing set and return an
        // arbitrary page of newest listings, which has nothing to do with what was asked.
        if (Boolean.FALSE.equals(filters.isRoomSearchRequest)) {
            return AiSearchResponse.builder()
                    .reply(fallbackReply)
                    .listings(List.of())
                    .build();
        }

        // The model has been observed hallucinating a city (e.g. filling "Ha Noi" while its
        // own "reply" correctly explains there's no data for the place actually asked about,
        // like Nha Trang) rather than leaving it null as instructed. Silently trusting that
        // field would show real Hanoi listings under a reply that just said "no data here" -
        // a direct contradiction. This deterministic scan catches the common case: the user
        // named a real Vietnamese province/city we don't have listings for.
        // Skipped for landmarks: coordinates settle the location, and this scan misfires on "Nguyễn Huệ", "Vinhomes"...
        String unsupportedLocation = filters.landmark == null ? findUnsupportedLocation(message) : null;
        if (unsupportedLocation != null) {
            return AiSearchResponse.builder()
                    .reply("Hiện hệ thống chưa có dữ liệu phòng trọ ở khu vực " + unsupportedLocation
                            + ". Bạn có thể tham khảo các thành phố đang hỗ trợ: "
                            + String.join(", ", KNOWN_CITIES) + ".")
                    .listings(List.of())
                    .build();
        }

        boolean hasOpenEndedKeyword = applyExplicitPriceKeywordOverride(message, filters);

        List<Amenity> amenities = toAmenities(filters.amenities);
        BigDecimal minPrice = toVndAmount(filters.minPriceMillion);
        BigDecimal maxPrice = toVndAmount(filters.maxPriceMillion);

        // A bare price ("phong 2tr1") is meant as an exact figure - both min and max should
        // equal it - but the model sometimes only fills one of the two fields for that case.
        // As long as the user didn't actually say "duoi"/"tren" (which legitimately means only
        // one side is bounded), treat a lone value as the exact price and mirror it to both.
        if (!hasOpenEndedKeyword) {
            if (minPrice != null && maxPrice == null) {
                maxPrice = minPrice;
            } else if (maxPrice != null && minPrice == null) {
                minPrice = maxPrice;
            }
        }

        // "tam/khoang X trieu" (a single approximate figure, no explicit range) - the model
        // only reports the bare number here, the +-1 trieu widening is done here rather than
        // asking it to compute X-1/X+1 itself, which made it unstable (see toVndAmount javadoc).
        if (minPrice == null && maxPrice == null && filters.approxPriceMillion != null) {
            BigDecimal approx = toVndAmount(filters.approxPriceMillion);
            if (approx != null) {
                BigDecimal oneMillion = BigDecimal.valueOf(1_000_000);
                BigDecimal lower = approx.subtract(oneMillion);
                minPrice = lower.signum() > 0 ? lower : BigDecimal.ZERO;
                maxPrice = approx.add(oneMillion);
            }
        }

        if (filters.landmark != null) {
            return searchNearLandmark(message, filters, minPrice, maxPrice, amenities, fallbackReply);
        }

        Pageable pageable = PageRequest.of(0, RESULT_LIMIT, Sort.by(Sort.Direction.DESC, "createdAt"));

        List<com.example.project.dto.response.RoomListingResponse> results = roomListingService.search(
                        filters.city, filters.district, null, minPrice, maxPrice,
                        null, null, null, amenities, pageable)
                .getContent();

        // Strict match only - if nothing satisfies every criterion the user actually gave
        // (area, price, amenities), say so plainly rather than silently substituting a
        // different district or a price outside what was asked for. A "closest match" that
        // quietly breaks one of the stated constraints reads as a wrong answer, not a helpful
        // one - the user explicitly asked for "not found" over any such substitution.
        String reply = fallbackReply;
        if (results.isEmpty()) {
            StringBuilder where = new StringBuilder();
            if (filters.district != null) {
                where.append(" ở ").append(filters.district);
            }
            if (filters.city != null) {
                where.append(where.isEmpty() ? " ở " : ", ").append(filters.city);
            }
            reply = "Hiện chưa có phòng nào trên hệ thống khớp đúng với yêu cầu này" + where
                    + ", bạn thử nới rộng mức giá hoặc khu vực xem sao nhé.";
        }

        return AiSearchResponse.builder()
                .reply(reply)
                .listings(results)
                .build();
    }

    // City/district filters are ignored: "near X" is a radius, and the nearest rooms often sit across a district line.
    private AiSearchResponse searchNearLandmark(String message, GeminiFilters filters, BigDecimal minPrice,
                                                BigDecimal maxPrice, List<Amenity> amenities, String fallbackReply) {
        GeocodingService.GeoPlace place = geocodingService.geocode(filters.landmark).orElse(null);
        if (place == null) {
            return AiSearchResponse.builder()
                    .reply("Mình chưa xác định được vị trí \"" + filters.landmark + "\" trên bản đồ. "
                            + "Bạn thử ghi rõ tên địa điểm kèm quận hoặc thành phố nhé.")
                    .listings(List.of())
                    .build();
        }

        // The model invents a radius for a plain "gần X" despite the prompt; only trust it when the user stated a distance.
        boolean statedDistance = EXPLICIT_DISTANCE.matcher(stripDiacritics(message.toLowerCase())).find();
        double radiusKm = statedDistance ? parseRadiusKm(filters.radiusKm) : DEFAULT_RADIUS_KM;
        List<com.example.project.dto.response.RoomListingResponse> results = roomListingService.searchNearby(
                place.latitude(), place.longitude(), radiusKm, minPrice, maxPrice, amenities, RESULT_LIMIT);

        String reply = results.isEmpty()
                ? "Chưa có phòng nào trong bán kính " + formatKm(radiusKm) + " quanh " + filters.landmark
                        + " khớp đúng yêu cầu này. Bạn thử nới rộng bán kính (ví dụ \"trong bán kính 5km\") "
                        + "hoặc mức giá xem sao nhé."
                : fallbackReply;

        // Name = what the user meant (Goong's own name can be an acronym like "HUST"); address = what Goong matched.
        return AiSearchResponse.builder()
                .reply(reply)
                .listings(results)
                .landmark(LandmarkResponse.builder()
                        .name(filters.landmark)
                        .address(place.address())
                        .latitude(place.latitude())
                        .longitude(place.longitude())
                        .radiusKm(radiusKm)
                        .build())
                .build();
    }

    private double parseRadiusKm(String radiusText) {
        if (radiusText == null) {
            return DEFAULT_RADIUS_KM;
        }
        java.util.regex.Matcher numberMatch = EMBEDDED_NUMBER.matcher(radiusText.replace(",", "."));
        if (!numberMatch.find()) {
            return DEFAULT_RADIUS_KM;
        }
        double km = Double.parseDouble(numberMatch.group(1));
        return Math.max(MIN_RADIUS_KM, Math.min(MAX_RADIUS_KM, km));
    }

    private String formatKm(double km) {
        return (km == Math.rint(km) ? String.valueOf((long) km) : String.valueOf(km).replace('.', ',')) + " km";
    }

    private GeminiFilters extractFilters(String message) throws Exception {
        Map<String, Object> requestBody = Map.of(
                "system_instruction", Map.of("parts", List.of(Map.of("text", buildSystemPrompt()))),
                "contents", List.of(Map.of("parts", List.of(Map.of("text", message)))),
                "generationConfig", Map.of(
                        "responseMimeType", "application/json",
                        "responseSchema", buildResponseSchema()));

        String url = "https://generativelanguage.googleapis.com/v1beta/models/" + model
                + ":generateContent?key=" + apiKey;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) {
            throw new IllegalStateException("Gemini API tra ve status " + response.statusCode() + ": " + response.body());
        }

        JsonNode root = objectMapper.readTree(response.body());
        String jsonText = root.path("candidates").path(0).path("content").path("parts").path(0).path("text").asText();
        return objectMapper.readValue(jsonText, GeminiFilters.class);
    }

    private static final java.util.regex.Pattern VN_THOUSANDS_GROUPED =
            java.util.regex.Pattern.compile("^\\d{1,3}(\\.\\d{3})+$");

    private static final java.util.regex.Pattern DUOI_KEYWORD =
            java.util.regex.Pattern.compile("duoi\\D{0,5}(\\d+(?:[.,]\\d+)?)");
    private static final java.util.regex.Pattern TREN_KEYWORD =
            java.util.regex.Pattern.compile("tren\\D{0,5}(\\d+(?:[.,]\\d+)?)");

    // Vietnamese compact price slang glues the "hundred-thousands" digit straight onto "tr"
    // instead of using a decimal point: "3tr7" means 3.7 trieu, not 3 - normalize that to
    // "3.7" everywhere before the duoi/tren regexes above ever see the text, otherwise they
    // capture only the "3" and silently turn "duoi 3tr7" into a much lower ceiling (3tr) than
    // the user asked for, hiding real listings priced between the truncated and real value.
    private static final java.util.regex.Pattern COMPACT_TR_DECIMAL =
            java.util.regex.Pattern.compile("(\\d+)tr(\\d)(?!\\d)");

    // "duoi X" (under) and "tren X" (over) are unambiguous, common enough phrasings that
    // they don't need the model's judgement at all - and the model has been observed
    // mis-classifying "duoi 4tr" as the vaguer "approxPriceMillion" case (reply correctly
    // said "duoi 4 trieu" but it populated the wrong field), which silently turns a hard
    // ceiling into a +-1tr window and lets listings above the stated limit slip through.
    // This deterministic keyword scan overrides whichever field the model chose whenever
    // the user's own words are this explicit, so the ceiling/floor is never just a guess.
    private boolean applyExplicitPriceKeywordOverride(String message, GeminiFilters filters) {
        String normalized = stripDiacritics(message.toLowerCase());
        normalized = COMPACT_TR_DECIMAL.matcher(normalized).replaceAll("$1.$2");
        boolean matched = false;

        java.util.regex.Matcher duoiMatch = DUOI_KEYWORD.matcher(normalized);
        if (duoiMatch.find()) {
            filters.maxPriceMillion = duoiMatch.group(1);
            filters.approxPriceMillion = null;
            matched = true;
        }

        java.util.regex.Matcher trenMatch = TREN_KEYWORD.matcher(normalized);
        if (trenMatch.find()) {
            filters.minPriceMillion = trenMatch.group(1);
            filters.approxPriceMillion = null;
            matched = true;
        }

        return matched;
    }

    // Structured output isn't a hard guarantee - the model sometimes writes the literal
    // text "null" for a field it means to leave empty instead of actually omitting it.
    // Left uncleaned, "district": "null" would be searched as a real district named
    // "null", always find nothing, and trigger the district-dropped fallback for no reason.
    private void sanitize(GeminiFilters filters) {
        filters.city = cleanString(filters.city);
        filters.district = cleanString(filters.district);
        filters.landmark = cleanString(filters.landmark);
        filters.radiusKm = cleanString(filters.radiusKm);
        filters.minPriceMillion = cleanString(filters.minPriceMillion);
        filters.maxPriceMillion = cleanString(filters.maxPriceMillion);
        filters.approxPriceMillion = cleanString(filters.approxPriceMillion);
    }

    private String cleanString(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return (trimmed.isEmpty() || trimmed.equalsIgnoreCase("null")) ? null : trimmed;
    }

    // Displays the province's normal Vietnamese capitalization in the reply (matched entry
    // is lowercase/no-diacritics for comparison, so this only needs to look presentable).
    private static final Map<String, String> UNSUPPORTED_LOCATION_DISPLAY = buildDisplayNames();

    private static Map<String, String> buildDisplayNames() {
        Map<String, String> display = new java.util.HashMap<>();
        for (String key : UNSUPPORTED_LOCATIONS) {
            String[] words = key.split(" ");
            StringBuilder titleCase = new StringBuilder();
            for (String word : words) {
                if (!titleCase.isEmpty()) {
                    titleCase.append(' ');
                }
                titleCase.append(Character.toUpperCase(word.charAt(0))).append(word.substring(1));
            }
            display.put(key, titleCase.toString());
        }
        return display;
    }

    private String findUnsupportedLocation(String message) {
        String normalized = stripDiacritics(message.toLowerCase());
        for (String location : UNSUPPORTED_LOCATIONS) {
            if (normalized.contains(location)) {
                return UNSUPPORTED_LOCATION_DISPLAY.get(location);
            }
        }
        return null;
    }

    private String stripDiacritics(String s) {
        String normalized = java.text.Normalizer.normalize(s, java.text.Normalizer.Form.NFD);
        normalized = normalized.replaceAll("\\p{InCombiningDiacriticalMarks}+", "");
        return normalized.replace('đ', 'd').replace('Đ', 'D');
    }

    private static final java.util.regex.Pattern EMBEDDED_NUMBER =
            java.util.regex.Pattern.compile("(\\d+(?:[.,]\\d+)?)");

    // Gemini is asked to report price as a STRING holding a small number of "trieu dong"
    // (e.g. "3", "4.5") rather than a raw NUMBER - a JSON number field in a responseSchema
    // has repeatedly caused this API to get stuck in a digit/exponent repetition loop until
    // it blows the output length (seen with both a 7-digit VND amount and a small decimal).
    // Even as a string, this model has been observed producing other garbled shapes: the
    // full amount Vietnamese-style with dot thousands-separators ("3.000.000"), or a valid
    // number with junk text glued on after it ("2.1ns_or_something_invalid..."). Rather than
    // trying to enumerate every shape it might mangle a number into, this only requires that
    // A number appears somewhere in the string and extracts just that, ignoring anything else
    // around it - strict whole-string parsing kept failing outright on real, live responses.
    private BigDecimal toVndAmount(String priceText) {
        if (priceText == null || priceText.isBlank()) {
            return null;
        }
        String trimmed = priceText.trim();
        if (VN_THOUSANDS_GROUPED.matcher(trimmed).matches()) {
            return new BigDecimal(trimmed.replace(".", ""));
        }
        java.util.regex.Matcher numberMatch = EMBEDDED_NUMBER.matcher(trimmed.replace(",", "."));
        if (!numberMatch.find()) {
            return null;
        }
        try {
            double million = Double.parseDouble(numberMatch.group(1));
            return BigDecimal.valueOf(million).multiply(BigDecimal.valueOf(1_000_000));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private List<Amenity> toAmenities(List<String> raw) {
        if (raw == null || raw.isEmpty()) {
            return List.of();
        }
        List<Amenity> amenities = new ArrayList<>();
        for (String code : raw) {
            try {
                amenities.add(Amenity.valueOf(code));
            } catch (IllegalArgumentException ignored) {
                // Model hallucinated a code outside the enum - skip it rather than fail the search.
            }
        }
        return amenities;
    }

    private String buildSystemPrompt() {
        StringBuilder amenityList = new StringBuilder();
        for (Amenity a : Amenity.values()) {
            amenityList.append("- ").append(a.name()).append('\n');
        }

        return """
                Ban la tro ly tim phong tro cho ung dung RoomieVibe (Viet Nam). Nhiem vu: doc yeu cau \
                tim phong bang tieng Viet tu nhien cua nguoi dung va trich xuat ra bo loc tim kiem dang JSON. \
                TUYET DOI KHONG duoc bia dat hay doan mo phong cu the nao - ban CHI trich xuat tieu chi loc, \
                he thong se tu tim trong du lieu that va hien thi ket qua that, ban khong duoc tu y noi la \
                "da tim thay X phong" hay mo ta chi tiet mot phong cu the nao vi ban khong biet du lieu that.

                Truong "isRoomSearchRequest" (boolean) LA BAT BUOC: dat true neu nguoi dung dang mo ta nhu \
                cau tim phong tro/can ho de thue (vi du co nhac gia, khu vuc, tien ich, loai phong). Dat \
                false neu day la loi chao hoi, cau hoi khong lien quan, hoac bat ky noi dung nao khong phai \
                yeu cau tim phong. Khi dat false, TAT CA cac truong loc khac (city, district, cac truong \
                gia, amenities) PHAI de null, va "reply" phai lich su giai thich ban chi ho tro tim phong tro \
                thoi, khong tra loi noi dung khac.

                Cac thanh pho HIEN CO du lieu (chi duoc dien dung 1 trong cac gia tri nay vao truong \
                "city"). Neu nguoi dung nhac den mot tinh/thanh khac KHONG co trong danh sach nay (vi du Nha \
                Trang, Vung Tau, Hue...), PHAI de city la null VA trong "reply" phai noi ro la he thong hien \
                chua co du lieu phong o khu vuc do, chi goi y cac thanh pho dang co:
                """ + String.join(", ", KNOWN_CITIES) + """


                Danh sach ma tien ich hop le cho truong "amenities" (chi dien khi nguoi dung nhac ro rang \
                hoac dung tu dong nghia quen thuoc, khong tu suy dien them):
                """ + amenityList + """
                Mot so tu dong nghia thuong gap: "may lanh"/"dieu hoa"/"AC" -> MAY_LANH; "cho de xe"/"ham xe"/\
                "gui xe" -> HAM_DE_XE; "an ninh"/"bao ve" -> BAO_VE_24_24; "camera" -> CAMERA_AN_NINH; \
                "noi that"/"do dac day du" -> NOI_THAT_DAY_DU; "nuoi cho meo"/"thu cung" -> CHO_NUOI_THU_CUNG.

                Ba truong gia "minPriceMillion", "maxPriceMillion", "approxPriceMillion" DEU la CHUOI KY TU \
                (string) chua DUNG MOT con so nho, TINH BANG DON VI TRIEU DONG, vi du "3" hoac "4.5". \
                KHONG duoc quy doi ra dong (khong duoc viet "3000000" hay "3.000.000"). KHONG duoc tu \
                cong tru hay tinh toan gi ca - chi viet lai dung con so nguoi dung da noi, he thong se tu \
                xu ly tiep. Luu y cach viet tat tien Viet hay dung: "2tr1" hoac "2tr 1" nghia la 2.1 trieu \
                (viet "2.1"); "1tr5" nghia la 1.5 trieu (viet "1.5"); "3tr" hoac "3 tr" nghia la 3 trieu \
                (viet "3").

                Quy tac chon truong gia nao de dien (CHI DIEN DUNG MOT TRONG BA TRUONG NAY cho moi lan, \
                hai truong con lai de null):
                - "duoi X trieu" -> dien maxPriceMillion = "X".
                - "tren X trieu" -> dien minPriceMillion = "X".
                - "khoang/tu X-Y trieu" (co 2 con so ro rang, cach nhau bang dau gach ngang hoac chu "den") \
                -> dien minPriceMillion = "X" va maxPriceMillion = "Y".
                - CHI khi co tu "tam", "khoang", hoac "tam khoang" NGAY TRUOC mot con so gia DUY NHAT (khong \
                phai khoang 2 dau-cuoi) -> dien approxPriceMillion = "X" (chi dien so X nguyen goc, KHONG \
                tinh khoang dao dong).
                - QUAN TRONG: neu nguoi dung chi noi TRAN mot con so gia, KHONG co bat ky tu nao trong so \
                "duoi/tren/khoang/tam" di kem (vi du "phong 2tr1", "gia 3 trieu", "3tr o Ha Noi") -> day LA \
                GIA CHINH XAC ho muon, PHAI dien CA HAI minPriceMillion = "X" VA maxPriceMillion = "X" (cung \
                mot gia tri X), TUYET DOI KHONG dung approxPriceMillion cho truong hop nay - ho muon dung \
                gia do, khong phai mot khoang dao dong.
                - Neu khong nhac gia thi de ca ba truong la null.

                Truong "district" la ten quan/huyen viet thuong nhu nguoi Viet hay goi (vi du "Cau Giay", \
                khong can them chu "Quan"), de null neu khong nhac den.

                Truong "landmark": CHI dien khi nguoi dung muon tim phong GAN / QUANH / CANH / GAN KHU mot \
                DIA DIEM CU THE (dia danh, truong hoc, benh vien, cho, cong vien, ho, toa nha, khu do thi, ga, \
                ben xe, cong ty...), vi du "gan Lang Bac", "quanh DH Bach Khoa", "canh cho Ben Thanh". Dien ten \
                dia diem do VIET DAY DU DAU TIENG VIET, KEM tinh/thanh pho de tra cuu duoc tren ban do, vi du: \
                "Lăng Bác, Hà Nội", "Đại học Bách khoa Hà Nội", "Chợ Bến Thành, TP. Hồ Chí Minh", \
                "Cầu Rồng, Đà Nẵng". Khi da co landmark thi de "district" la null (khu vuc se tinh theo ban kinh \
                quanh dia diem). Chi nhac ten quan/huyen/phuong/thanh pho (vi du "o Cau Giay") thi KHONG phai \
                landmark - dung truong district/city nhu binh thuong. Dia diem o tinh/thanh khong co du lieu van \
                dien landmark binh thuong, he thong se tu kiem tra.

                Truong "radiusKm" (chuoi, DON VI KM): chi dien khi nguoi dung neu ro khoang cach toi dia diem, vi \
                du "trong ban kinh 2km" -> "2", "cach khong qua 500m" -> "0.5"; hoac nhan manh rat gan nhu "di bo \
                duoc" / "sat vach" / "ngay canh" -> "1". Cac tu thong thuong "gan", "quanh", "gan khu", "khu vuc" \
                KHONG phai khoang cach cu the -> de radiusKm la null (he thong tu dung ban kinh mac dinh).

                Truong "reply" LA BAT BUOC: viet 1-2 cau tieng Viet CO DAU DAY DU, than thien, ngan gon, CHI xac \
                nhan lai dung nhung tieu chi ban vua trich xuat duoc (vi du: "Mình tìm phòng ở Cầu Giấy, Hà Nội, \
                giá dưới 3 triệu cho bạn nhé!"). KHONG duoc noi bat ky con so ket qua cu the nao (vi du KHONG \
                duoc noi "tim thay 5 phong" hay "co nhieu phong phu hop") vi ban khong biet ket qua that - \
                he thong se tu them thong tin do sau khi tim xong.
                """;
    }

    private Map<String, Object> buildResponseSchema() {
        List<String> amenityCodes = new ArrayList<>();
        for (Amenity a : Amenity.values()) {
            amenityCodes.add(a.name());
        }

        return Map.of(
                "type", "OBJECT",
                "properties", Map.of(
                        "isRoomSearchRequest", Map.of("type", "BOOLEAN"),
                        "city", Map.of("type", "STRING", "enum", KNOWN_CITIES),
                        "district", Map.of("type", "STRING"),
                        "landmark", Map.of("type", "STRING"),
                        "radiusKm", Map.of("type", "STRING"),
                        "minPriceMillion", Map.of("type", "STRING"),
                        "maxPriceMillion", Map.of("type", "STRING"),
                        "approxPriceMillion", Map.of("type", "STRING"),
                        "amenities", Map.of(
                                "type", "ARRAY",
                                "items", Map.of("type", "STRING", "enum", amenityCodes)),
                        "reply", Map.of("type", "STRING")),
                "required", List.of("isRoomSearchRequest", "reply"));
    }

    private static class GeminiFilters {
        public Boolean isRoomSearchRequest;
        public String city;
        public String district;
        public String landmark;
        public String radiusKm;
        public String minPriceMillion;
        public String maxPriceMillion;
        public String approxPriceMillion;
        public List<String> amenities;
        public String reply;
    }
}
