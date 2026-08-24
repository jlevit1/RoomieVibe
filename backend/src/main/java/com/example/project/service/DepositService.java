package com.example.project.service;

import java.util.List;

import com.example.project.dto.response.ChatMessageResponse;
import com.example.project.dto.response.DepositBookingResponse;

public interface DepositService {

    ChatMessageResponse pay(String email, Long depositId);

    ChatMessageResponse cancel(String email, Long depositId);

    ChatMessageResponse complete(String email, Long depositId);

    ChatMessageResponse dispute(String email, Long depositId, String reason);

    List<DepositBookingResponse> listDisputed();

    ChatMessageResponse resolveDispute(Long depositId, boolean releaseToLandlord, String note);
}
