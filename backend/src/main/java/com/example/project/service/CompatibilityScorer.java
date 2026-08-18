package com.example.project.service;

import com.example.project.entity.RoommateProfile;

/**
 * Tinh % tuong thich giua 2 ho so ban ghep. Tach rieng thanh interface de
 * sau nay co the thay bang 1 cai dat dung AI/ML ma khong phai sua cac phan khac.
 */
public interface CompatibilityScorer {

    /** Tra ve diem tuong thich tu 0 den 100. */
    int score(RoommateProfile a, RoommateProfile b);
}
