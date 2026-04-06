import { useLocalization } from "../../contexts/localizationContext";
import { HtmlContent } from "./HtmlContent";

function getMetadataEntries(question) {
  return [
    ["Book Name", question.bookName],
    ["Book Edition", question.bookEdition],
    ["ISBN", question.isbn],
    ["Etg Number", question.etgNumber],
    ["Page Number", question.pageNumber],
    ["Question Number", question.questionNumber],
  ].filter(([, value]) => value != null && String(value).trim() !== "");
}

export function MetadataPanel({ question, compact = false }) {
  const { t } = useLocalization();
  const entries = getMetadataEntries(question);

  if (entries.length === 0) return null;

  return (
    <details className={`qb-metadata-panel${compact ? " is-compact" : ""}`}>
      <summary className="qb-metadata-summary">
        <span className="qb-metadata-title">{t("Reference Metadata")}</span>
        <span className="qb-metadata-toggle" />
      </summary>
      <div className="qb-metadata-grid">
        {entries.map(([label, value]) => (
          <div key={label} className="qb-metadata-card">
            <div className="qb-metadata-label">{t(label)}</div>
            <HtmlContent html={value} className="qb-metadata-value" />
          </div>
        ))}
      </div>
    </details>
  );
}
