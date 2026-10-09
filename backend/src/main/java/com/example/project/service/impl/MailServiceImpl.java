package com.example.project.service.impl;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

import com.example.project.entity.Role;
import com.example.project.entity.User;
import com.example.project.service.MailService;

import jakarta.mail.internet.MimeMessage;
import lombok.extern.slf4j.Slf4j;

/**
 * Sends account emails through whatever SMTP server spring.mail.* points at (Gmail with an app password
 * by default). Without credentials - e.g. a fresh dev checkout - emails are written to the log instead,
 * so flows like "quen mat khau" can still be tested by copying the link from the console.
 */
@Slf4j
@Service
public class MailServiceImpl implements MailService {

    private static final String BRAND = "#1f84b8";

    private final ObjectProvider<JavaMailSender> mailSender;
    private final String username;
    private final String fromAddress;
    private final String fromName;
    private final String frontendUrl;

    public MailServiceImpl(ObjectProvider<JavaMailSender> mailSender,
                           @Value("${spring.mail.username:}") String username,
                           @Value("${app.mail.from:}") String fromAddress,
                           @Value("${app.mail.from-name:RoomieVibe}") String fromName,
                           @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl) {
        this.mailSender = mailSender;
        this.username = username;
        this.fromAddress = fromAddress.isBlank() ? username : fromAddress;
        this.fromName = fromName;
        this.frontendUrl = frontendUrl.replaceAll("/+$", "");
    }

    @Async
    @Override
    public void sendWelcome(User user) {
        Email email = new Email("Chào mừng bạn đến với RoomieVibe")
                .paragraph("Chào " + user.getFullName() + ",")
                .paragraph("Tài khoản RoomieVibe của bạn đã sẵn sàng. Đăng nhập bằng email " + user.getEmail() + ".");
        if (user.getRole() == Role.LANDLORD) {
            email.paragraph("Vài điều giúp tin của bạn được duyệt nhanh và có nhiều người hỏi thuê:")
                    .bullet("Đăng ít nhất 3 ảnh thật của phòng, có cả nhà vệ sinh.")
                    .bullet("Chọn gợi ý địa chỉ để ghim phòng lên bản đồ.")
                    .bullet("Ghi rõ giá điện, nước và giờ giấc trong phần mô tả.")
                    .button("Đăng tin đầu tiên", link("/listings/new"));
        } else {
            email.paragraph("Bạn có thể bắt đầu ngay:")
                    .bullet("Tìm phòng theo khu vực, mức giá, hoặc nhờ Trợ lý AI tìm quanh trường, nơi làm.")
                    .bullet("Lưu phòng ưng ý để so sánh sau.")
                    .bullet("Đặt cọc xem phòng qua ví RoomieVibe: tiền được giữ hộ cho tới khi bạn xác nhận đã xem.")
                    .button("Tìm phòng ngay", link("/search"));
        }
        send(user, email);
    }

    @Async
    @Override
    public void sendPasswordResetCode(User user, String code, int validMinutes) {
        Email email = new Email("Mã xác nhận đặt lại mật khẩu: " + code)
                .paragraph("Chào " + user.getFullName() + ",")
                .paragraph("Mã xác nhận để đặt lại mật khẩu cho tài khoản " + user.getEmail() + " là:")
                .code(code)
                .note("Mã có hiệu lực trong " + validMinutes + " phút. Không chia sẻ mã này cho bất kỳ ai, kể cả người tự xưng là RoomieVibe.")
                .note("Nếu bạn không yêu cầu, hãy bỏ qua email này. Mật khẩu hiện tại của bạn vẫn giữ nguyên.");
        send(user, email);
    }

    @Async
    @Override
    public void sendPasswordChanged(User user) {
        Email email = new Email("Mật khẩu RoomieVibe của bạn vừa được thay đổi")
                .paragraph("Chào " + user.getFullName() + ",")
                .paragraph("Mật khẩu tài khoản " + user.getEmail() + " vừa được đổi lúc "
                        + Formats.dateTime(Instant.now()) + ".")
                .paragraph("Nếu đó là bạn, bạn không cần làm gì thêm. Nếu không phải bạn, hãy đặt lại mật khẩu ngay để bảo vệ tài khoản và ví.")
                .button("Đặt lại mật khẩu", link("/forgot-password"));
        send(user, email);
    }

    @Async
    @Override
    public void sendAccountLocked(User user) {
        Email email = new Email("Tài khoản RoomieVibe của bạn đã bị tạm khóa")
                .paragraph("Chào " + user.getFullName() + ",")
                .paragraph("Quản trị viên đã tạm khóa tài khoản " + user.getEmail()
                        + ". Trong thời gian này bạn không thể đăng nhập, đăng tin hay nhắn tin.")
                .paragraph("Số dư ví và các khoản cọc đang được giữ vẫn được bảo toàn.")
                .note("Nếu bạn cho rằng đây là nhầm lẫn, hãy trả lời email này để được hỗ trợ.");
        send(user, email);
    }

    @Async
    @Override
    public void sendAccountUnlocked(User user) {
        Email email = new Email("Tài khoản RoomieVibe của bạn đã được mở khóa")
                .paragraph("Chào " + user.getFullName() + ",")
                .paragraph("Tài khoản " + user.getEmail() + " đã được mở khóa. Bạn có thể đăng nhập và sử dụng lại bình thường.")
                .button("Đăng nhập", link("/login"));
        send(user, email);
    }

    @Async
    @Override
    public void sendNotice(String toEmail, String toName, String subject, String message, List<String> details,
                           String buttonLabel, String path) {
        Email email = new Email(subject)
                .paragraph("Chào " + toName + ",")
                .paragraph(message);
        if (details != null) details.forEach(email::bullet);
        if (buttonLabel != null && path != null) email.button(buttonLabel, link(path));
        send(toEmail, email);
    }

    private String link(String path) {
        return frontendUrl + path;
    }

    private void send(User user, Email email) {
        send(user.getEmail(), email);
    }

    private void send(String toEmail, Email email) {
        JavaMailSender sender = mailSender.getIfAvailable();
        if (sender == null || username.isBlank()) {
            log.info("[MAIL - chua cau hinh SMTP, chi ghi log] To: {} | {}\n{}", toEmail, email.subject, email.plainText());
            return;
        }
        try {
            MimeMessage message = sender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress, fromName);
            helper.setReplyTo(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(email.subject);
            helper.setText(email.plainText(), email.html(frontendUrl));
            sender.send(message);
            log.info("Sent mail '{}' to {}", email.subject, toEmail);
        } catch (Exception e) {
            // Emails are best-effort: a mail outage must never break registration, password reset or admin actions.
            log.error("Could not send mail '{}' to {}: {}", email.subject, toEmail, e.getMessage());
        }
    }

    /** Tiny builder so every email shares one branded, table-based layout that renders in Gmail/Outlook. */
    private static final class Email {
        private final String subject;
        private final List<String> htmlBlocks = new ArrayList<>();
        private final List<String> textBlocks = new ArrayList<>();
        private final List<String> bullets = new ArrayList<>();

        Email(String subject) {
            this.subject = subject;
        }

        Email paragraph(String text) {
            flushBullets();
            htmlBlocks.add("<p style=\"margin:0 0 16px;font-size:15px;line-height:24px;color:#1f2937\">" + esc(text) + "</p>");
            textBlocks.add(text);
            return this;
        }

        Email bullet(String text) {
            bullets.add(text);
            return this;
        }

        Email button(String label, String url) {
            flushBullets();
            htmlBlocks.add("<table role=\"presentation\" cellspacing=\"0\" cellpadding=\"0\" style=\"margin:8px 0 24px\"><tr>"
                    + "<td style=\"border-radius:12px;background:" + BRAND + "\">"
                    + "<a href=\"" + esc(url) + "\" style=\"display:inline-block;padding:12px 22px;font-size:15px;font-weight:600;"
                    + "color:#ffffff;text-decoration:none;border-radius:12px\">" + esc(label) + "</a></td></tr></table>");
            textBlocks.add(label + ": " + url);
            return this;
        }

        Email note(String text) {
            flushBullets();
            htmlBlocks.add("<p style=\"margin:0 0 12px;font-size:13px;line-height:20px;color:#6b7280\">" + esc(text) + "</p>");
            textBlocks.add(text);
            return this;
        }

        Email code(String code) {
            flushBullets();
            htmlBlocks.add("<p style=\"margin:4px 0 24px;padding:16px 0;border-radius:12px;background:#f3f4f6;text-align:center;"
                    + "font-family:'Courier New',monospace;font-size:32px;font-weight:700;letter-spacing:10px;color:#111827\">"
                    + esc(code) + "</p>");
            textBlocks.add(code);
            return this;
        }

        Email fallbackLink(String url) {
            flushBullets();
            htmlBlocks.add("<p style=\"margin:16px 0 0;font-size:12px;line-height:18px;color:#6b7280\">"
                    + "Nút không bấm được? Dán link này vào trình duyệt:<br>"
                    + "<a href=\"" + esc(url) + "\" style=\"color:" + BRAND + ";word-break:break-all\">" + esc(url) + "</a></p>");
            return this;
        }

        private void flushBullets() {
            if (bullets.isEmpty()) return;
            StringBuilder html = new StringBuilder("<ul style=\"margin:0 0 20px;padding-left:20px;font-size:15px;line-height:24px;color:#1f2937\">");
            bullets.forEach(b -> {
                html.append("<li style=\"margin-bottom:6px\">").append(esc(b)).append("</li>");
                textBlocks.add("- " + b);
            });
            htmlBlocks.add(html.append("</ul>").toString());
            bullets.clear();
        }

        String plainText() {
            flushBullets();
            return String.join("\n\n", textBlocks) + "\n\n-- \nRoomieVibe";
        }

        String html(String siteUrl) {
            flushBullets();
            return "<!doctype html><html lang=\"vi\"><head><meta charset=\"utf-8\">"
                    + "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\"><title>" + esc(subject) + "</title></head>"
                    + "<body style=\"margin:0;padding:0;background:#f3f4f6;font-family:'Be Vietnam Pro',Arial,Helvetica,sans-serif\">"
                    + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"background:#f3f4f6;padding:32px 16px\"><tr><td align=\"center\">"
                    + "<table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:560px\">"
                    + "<tr><td style=\"padding:0 4px 16px\"><a href=\"" + esc(siteUrl) + "\" style=\"font-size:22px;font-weight:700;color:" + BRAND
                    + ";text-decoration:none\">RoomieVibe</a></td></tr>"
                    + "<tr><td style=\"background:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px 28px\">"
                    + "<h1 style=\"margin:0 0 20px;font-size:20px;line-height:28px;color:#111827\">" + esc(subject) + "</h1>"
                    + String.join("", htmlBlocks)
                    + "</td></tr>"
                    + "<tr><td style=\"padding:16px 4px 0;font-size:12px;line-height:18px;color:#6b7280\">"
                    + "Bạn nhận được email này vì có tài khoản tại RoomieVibe, nền tảng tìm phòng trọ và bạn ở ghép."
                    + "</td></tr></table></td></tr></table></body></html>";
        }

        private static String esc(String text) {
            return HtmlUtils.htmlEscape(text == null ? "" : text, "UTF-8");
        }
    }
}
