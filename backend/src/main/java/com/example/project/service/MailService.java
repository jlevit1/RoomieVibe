package com.example.project.service;

import java.util.List;

import com.example.project.entity.User;

/** Account emails. Every method sends in the background and never throws back to the caller. */
public interface MailService {

    void sendWelcome(User user);

    void sendPasswordResetCode(User user, String code, int validMinutes);

    void sendPasswordChanged(User user);

    void sendAccountLocked(User user);

    void sendAccountUnlocked(User user);

    /**
     * Generic event email (deposit, wallet, listing...). Takes plain strings, not entities, so it is safe to run
     * on the async thread after the caller's transaction (and Hibernate session) is gone.
     * {@code path} is a site path such as "/messages/5"; the button is skipped when it or the label is null.
     */
    void sendNotice(String toEmail, String toName, String subject, String message, List<String> details,
                    String buttonLabel, String path);
}
