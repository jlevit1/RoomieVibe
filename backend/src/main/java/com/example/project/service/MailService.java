package com.example.project.service;

import com.example.project.entity.User;

/** Account emails. Every method sends in the background and never throws back to the caller. */
public interface MailService {

    void sendWelcome(User user);

    void sendPasswordReset(User user, String resetLink, int validMinutes);

    void sendPasswordChanged(User user);

    void sendAccountLocked(User user);

    void sendAccountUnlocked(User user);
}
