package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;

public interface RoommateProfileRepository extends JpaRepository<RoommateProfile, Long> {

    Optional<RoommateProfile> findByUser(User user);

    List<RoommateProfile> findByUserIdNot(Long userId);
}
