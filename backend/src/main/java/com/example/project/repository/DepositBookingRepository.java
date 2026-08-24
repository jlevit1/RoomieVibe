package com.example.project.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.DepositBooking;
import com.example.project.entity.DepositStatus;

public interface DepositBookingRepository extends JpaRepository<DepositBooking, Long> {

    List<DepositBooking> findByStatusOrderByCreatedAtDesc(DepositStatus status);
}
