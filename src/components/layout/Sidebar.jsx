import React from "react";
import { NavIcon } from "../icons/NavIcon";

export function Sidebar({
  isSidebarCollapsed,
  setIsSidebarCollapsed,
  t,
  goListView,
  toggleSidebarSection,
  sidebarSections,
  view,
  goCreateView,
  showToast,
}) {
  return (
    <aside
      className="app-sidebar"
      style={{
        width: isSidebarCollapsed ? 76 : 246,
        transition: "width .2s ease",
      }}
    >
      <div
        className="app-sidebar-header"
        style={{
          justifyContent: isSidebarCollapsed ? "center" : "space-between",
          padding: isSidebarCollapsed ? "0 10px" : "0 16px",
        }}
      >
        {!isSidebarCollapsed && (
          <div>
            <div className="app-sidebar-brand-title">{t("Question")}</div>
            <div className="app-sidebar-brand-subtitle">{t("Bank")}</div>
          </div>
        )}
        <button
          type="button"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          className="app-sidebar-collapse-btn"
        >
          <NavIcon name="menu" />
        </button>
      </div>

      <div className="app-sidebar-content">
        <button
          type="button"
          onClick={goListView}
          className="sidebar-row-btn sidebar-row-muted"
          style={{
            padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
            justifyContent: isSidebarCollapsed ? "center" : "flex-start",
          }}
        >
          <span className="sidebar-row-chevron">
            <NavIcon name="home" />
          </span>
          {!isSidebarCollapsed && <span>{t("Dashboard")}</span>}
        </button>

        <button
          type="button"
          onClick={() => !isSidebarCollapsed && toggleSidebarSection("question")}
          className="sidebar-row-btn sidebar-row-primary"
          style={{
            padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
            justifyContent: isSidebarCollapsed ? "center" : "space-between",
          }}
        >
          <span className="sidebar-row-main">
            <span className="sidebar-row-chevron">
              <NavIcon name="question" />
            </span>
            {!isSidebarCollapsed && <span>{t("Question")}</span>}
          </span>
          {!isSidebarCollapsed && (
            <span className="sidebar-row-chevron">
              <NavIcon name={sidebarSections.question ? "chevronUp" : "chevronDown"} />
            </span>
          )}
        </button>

        {!isSidebarCollapsed && sidebarSections.question && (
          <div className="sidebar-submenu">
            {[
              {
                key: "create-question",
                label: t("Create New Question"),
                active: view === "create",
                action: goCreateView,
              },
              {
                key: "all-question",
                label: t("All Question"),
                active: view === "list",
                action: goListView,
              },
              {
                key: "question-category",
                label: t("Question Category"),
                active: false,
                action: () => showToast(t("Question Category view coming soon"), "warn"),
              },
            ].map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={item.action}
                className={`sidebar-submenu-btn ${item.active ? "active" : ""}`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => !isSidebarCollapsed && toggleSidebarSection("exam")}
          className="sidebar-row-btn sidebar-row-muted"
          style={{
            marginTop: 10,
            padding: isSidebarCollapsed ? "10px 8px" : "10px 6px",
            justifyContent: isSidebarCollapsed ? "center" : "space-between",
          }}
        >
          <span className="sidebar-row-main">
            <span className="sidebar-row-chevron">
              <NavIcon name="exam" />
            </span>
            {!isSidebarCollapsed && <span>{t("Exam")}</span>}
          </span>
          {!isSidebarCollapsed && (
            <span className="sidebar-row-chevron">
              <NavIcon name={sidebarSections.exam ? "chevronUp" : "chevronDown"} />
            </span>
          )}
        </button>
      </div>
    </aside>
  );
}
