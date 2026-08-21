package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.FavoriteRoommateProfile;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;

public interface FavoriteRoommateProfileRepository extends JpaRepository<FavoriteRoommateProfile, Long> {

    Optional<FavoriteRoommateProfile> findByUserAndProfile(User user, RoommateProfile profile);

    List<FavoriteRoommateProfile> findByUserOrderByCreatedAtDesc(User user);

    void deleteByUserAndProfile(User user, RoommateProfile profile);
}
