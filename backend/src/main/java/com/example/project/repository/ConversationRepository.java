package com.example.project.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.project.entity.Conversation;
import com.example.project.entity.RoomListing;
import com.example.project.entity.RoommateProfile;
import com.example.project.entity.User;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingAndRenter(RoomListing listing, User renter);

    Optional<Conversation> findByRoommateProfileAndRenter(RoommateProfile roommateProfile, User renter);

    List<Conversation> findByRenterOrderByCreatedAtDesc(User renter);

    List<Conversation> findByListing_LandlordOrderByCreatedAtDesc(User landlord);

    List<Conversation> findByRoommateProfile_UserOrderByCreatedAtDesc(User user);

    boolean existsByIdAndRenter_Email(Long id, String email);

    boolean existsByIdAndListing_Landlord_Email(Long id, String email);

    boolean existsByIdAndRoommateProfile_User_Email(Long id, String email);
}
