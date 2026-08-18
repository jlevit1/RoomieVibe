package com.example.project.service.impl;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.Objects;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.example.project.entity.RoommateProfile;
import com.example.project.service.CompatibilityScorer;

/**
 * Cai dat mac dinh: tinh diem theo trong so co dinh (khu vuc 25%, ngan sach 20%,
 * gio giac 15%, thu cung 15%, hut thuoc 10%, gioi tinh 10%, loi song khac 5%).
 */
@Service
public class WeightedCompatibilityScorer implements CompatibilityScorer {

    @Override
    public int score(RoommateProfile a, RoommateProfile b) {
        double total = 0;
        total += areaScore(a, b) * 0.25;
        total += budgetScore(a, b) * 0.20;
        total += (a.getSleepSchedule() == b.getSleepSchedule() ? 1 : 0) * 0.15;
        total += petScore(a, b) * 0.15;
        total += smokingScore(a, b) * 0.10;
        total += genderScore(a, b) * 0.10;
        total += lifestyleScore(a, b) * 0.05;

        return (int) Math.round(total * 100);
    }

    private double areaScore(RoommateProfile a, RoommateProfile b) {
        Set<String> aDistricts = a.getDistricts() == null ? Collections.emptySet() : a.getDistricts();
        Set<String> bDistricts = b.getDistricts() == null ? Collections.emptySet() : b.getDistricts();
        return aDistricts.stream().anyMatch(bDistricts::contains) ? 1.0 : 0.0;
    }

    private double budgetScore(RoommateProfile a, RoommateProfile b) {
        BigDecimal budgetA = a.getBudget();
        BigDecimal budgetB = b.getBudget();
        if (budgetA == null || budgetB == null || budgetA.signum() == 0 || budgetB.signum() == 0) {
            return 0.0;
        }

        double higher = Math.max(budgetA.doubleValue(), budgetB.doubleValue());
        double diffRatio = Math.abs(budgetA.doubleValue() - budgetB.doubleValue()) / higher;

        if (diffRatio <= 0.2) {
            return 1.0;
        }
        double decayed = 1.0 - (diffRatio - 0.2) / 0.8;
        return Math.max(0.0, decayed);
    }

    private double petScore(RoommateProfile a, RoommateProfile b) {
        boolean aOk = !Boolean.TRUE.equals(a.getHasPet()) || Boolean.TRUE.equals(b.getAcceptsPets());
        boolean bOk = !Boolean.TRUE.equals(b.getHasPet()) || Boolean.TRUE.equals(a.getAcceptsPets());
        return (aOk && bOk) ? 1.0 : 0.0;
    }

    private double smokingScore(RoommateProfile a, RoommateProfile b) {
        boolean aOk = !Boolean.TRUE.equals(a.getSmokes()) || Boolean.TRUE.equals(b.getAcceptsSmoking());
        boolean bOk = !Boolean.TRUE.equals(b.getSmokes()) || Boolean.TRUE.equals(a.getAcceptsSmoking());
        return (aOk && bOk) ? 1.0 : 0.0;
    }

    private double genderScore(RoommateProfile a, RoommateProfile b) {
        boolean aOk = a.getPreferredGender() == null || a.getPreferredGender() == b.getGender();
        boolean bOk = b.getPreferredGender() == null || b.getPreferredGender() == a.getGender();
        return (aOk && bOk) ? 1.0 : 0.0;
    }

    private double lifestyleScore(RoommateProfile a, RoommateProfile b) {
        double cleanlinessMatch = a.getCleanliness() == b.getCleanliness() ? 1.0 : 0.0;
        double cookingMatch = Objects.equals(a.getCooksAtHome(), b.getCooksAtHome()) ? 1.0 : 0.0;
        return (cleanlinessMatch + cookingMatch) / 2.0;
    }
}
