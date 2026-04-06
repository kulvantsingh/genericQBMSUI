import { useLocalization } from "../../contexts/localizationContext";

export function Spinner() {
  const { t } = useLocalization();
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 60,
        flexDirection: "column",
        gap: 16,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "3px solid var(--spinner-track)",
          borderTopColor: "var(--spinner-head)",
          animation: "spin .8s linear infinite",
        }}
      />
      <span style={{ color: "var(--text-muted)", fontSize: 14 }}>
        {t("Fetching from Spring Boot...")}
      </span>
    </div>
  );
}
