package com.example.project.repository;

import java.time.Instant;
import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.User;
import com.example.project.entity.WalletTransaction;
import com.example.project.entity.WalletTransactionType;

public interface WalletTransactionRepository extends JpaRepository<WalletTransaction, Long> {

    List<WalletTransaction> findByUserOrderByCreatedAtDesc(User user);

    List<WalletTransaction> findByTypeAndCreatedAtAfter(WalletTransactionType type, Instant since);
}
