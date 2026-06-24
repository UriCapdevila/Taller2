import unittest

import numpy as np
import pandas as pd

from pipeline.train_mortality_models import (
    CATEGORICAL_BASE,
    NUMERIC_FEATURES,
    prepare_model_frame,
    stratified_split,
)


class MortalityPipelineTests(unittest.TestCase):
    def setUp(self):
        size = 200
        self.frame = pd.DataFrame(
            {
                "AGE": np.tile([12, 28, 44, 58, 72], size // 5),
                "SEX": np.tile(["Male (Child)", "Female", "Male", "Female", "Male"], size // 5),
                "CASTE_NAME": np.tile(["BC", "OC"], size // 2),
                "CATEGORY_NAME": np.tile(["NEPHROLOGY", "CARDIOLOGY"], size // 2),
                "HOSP_TYPE": np.tile(["G", "C"], size // 2),
                "DISTRICT_NAME": "District A",
                "HOSP_DISTRICT": "District B",
                "SRC_REGISTRATION": "D",
                "PREAUTH_AMT": np.linspace(1000, 50000, size),
                "Mortality Y / N": ["YES"] * 20 + ["NO"] * 180,
                "MORTALITY_DATE": ["01/01/2020"] * size,
                "CLAIM_AMOUNT": np.arange(size),
            }
        )

    def test_only_pre_outcome_features_are_exposed(self):
        features, target = prepare_model_frame(self.frame, include_caste=False)
        self.assertEqual(set(features.columns), set(CATEGORICAL_BASE + NUMERIC_FEATURES))
        self.assertNotIn("MORTALITY_DATE", features.columns)
        self.assertNotIn("CLAIM_AMOUNT", features.columns)
        self.assertEqual(int(target.sum()), 20)

    def test_caste_feature_is_opt_in(self):
        general, _ = prepare_model_frame(self.frame, include_caste=False)
        caste, _ = prepare_model_frame(self.frame, include_caste=True)
        self.assertNotIn("CASTE_NAME", general.columns)
        self.assertIn("CASTE_NAME", caste.columns)

    def test_split_preserves_prevalence(self):
        features, target = prepare_model_frame(self.frame, include_caste=True)
        split = stratified_split(features, target)
        for split_target in split[3:]:
            self.assertAlmostEqual(float(split_target.mean()), float(target.mean()), places=2)


if __name__ == "__main__":
    unittest.main()
