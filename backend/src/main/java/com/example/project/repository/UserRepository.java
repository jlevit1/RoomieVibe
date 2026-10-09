package com.example.project.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.project.entity.Role;
import com.example.project.entity.User;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    long countByRole(Role role);

    List<User> findAllByOrderByCreatedAtDesc();

    List<User> findByCreatedAtAfter(Instant since);

    // Atomic balance change at the DB level - "read balance in Java, compute,
    // write back" is a lost-update race under concurrency (two simultaneous
    // wallet operations on the same user can both read the same starting
    // balance and overwrite each other). The WHERE clause also rejects the
    // update atomically if it would take the balance negative, so this doubles
    // as the authoritative "sufficient funds" check. Returns rows affected: 1
    // on success, 0 if the update would have gone negative.
    @Modifying
    @Query("UPDATE User u SET u.balance = u.balance + :delta WHERE u.id = :id AND u.balance + :delta >= 0")
    int adjustBalanceAtomic(@Param("id") Long id, @Param("delta") BigDecimal delta);

    @Query("SELECT u.balance FROM User u WHERE u.id = :id")
    BigDecimal getBalance(@Param("id") Long id);
}
