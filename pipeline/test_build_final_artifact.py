import unittest

from pipeline.build_final_artifact import split_conclusion_sections


class FinalArtifactTests(unittest.TestCase):
    def test_splits_headings_and_bold_subsections(self):
        conclusion = """## Conclusiones

Resumen inicial.

## Hallazgos

**Sobre la población.** Primer hallazgo.

**Sobre el acceso.** Segundo hallazgo.

## Limitaciones

No permite inferir causalidad.
"""

        sections = split_conclusion_sections(conclusion)

        self.assertEqual(
            [section["title"] for section in sections],
            ["Conclusiones", "Sobre la población", "Sobre el acceso", "Limitaciones"],
        )
        self.assertIn("Primer hallazgo", sections[1]["body"])
        self.assertEqual(len({section["id"] for section in sections}), 4)


if __name__ == "__main__":
    unittest.main()
