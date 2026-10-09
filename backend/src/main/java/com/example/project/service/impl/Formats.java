package com.example.project.service.impl;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/** Vietnamese-style money/date text for notifications and emails. */
final class Formats {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("HH:mm 'ngày' dd/MM/yyyy");
    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private Formats() {
    }

    /** 500000 -> "500.000đ" */
    static String money(BigDecimal amount) {
        NumberFormat format = NumberFormat.getIntegerInstance(new Locale("vi", "VN"));
        return format.format(amount) + "đ";
    }

    static String dateTime(Instant instant) {
        return DATE_TIME.format(instant.atZone(VN_ZONE));
    }

    static String date(Instant instant) {
        return DATE.format(instant.atZone(VN_ZONE));
    }
}
