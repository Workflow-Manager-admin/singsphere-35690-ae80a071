import React from "react";

/**
 * PUBLIC_INTERFACE
 * FilterSelector component for choosing voice effects/filters.
 * Props:
 *   - filters: Array of filter names [{label, value, icon}].
 *   - selectedFilters: Set or Array of selected filter values.
 *   - onChange: function(newSelectedFilters) called when filters are toggled.
 *   - selectionMode: "multiple" | "single" (default: "multiple")
 */
function FilterSelector({
  filters = [],
  selectedFilters = [],
  onChange,
  selectionMode = "multiple"
}) {
  function handleToggle(value) {
    if (selectionMode === "multiple") {
      if (selectedFilters.includes(value)) {
        onChange(selectedFilters.filter((f) => f !== value));
      } else {
        onChange([...selectedFilters, value]);
      }
    } else {
      onChange(selectedFilters[0] === value ? [] : [value]);
    }
  }

  return (
    <div
      style={{
        background: "rgba(30,42,52,0.92)",
        borderRadius: 12,
        padding: "20px 22px",
        maxWidth: 380,
        margin: "0 auto 16px auto",
        boxShadow: "0 2px 12px rgba(0,0,0,0.15)",
        border: "1.2px solid var(--border-color)"
      }}
      aria-label="Voice Filters"
      tabIndex={0}
    >
      <div
        style={{
          marginBottom: 14,
          fontWeight: 600,
          fontSize: "1.13rem",
          color: "var(--base-light, #00ffff)"
        }}
      >
        🎛️ Voice Filters
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 14
        }}
      >
        {filters.map((filter) => {
          const selected = selectedFilters.includes(filter.value);
          return (
            <button
              key={filter.value}
              className="btn"
              to={undefined}
              type="button"
              aria-pressed={selected}
              style={{
                background: selected
                  ? "linear-gradient(90deg, var(--base-light), #4A90E2)"
                  : "rgba(70,105,144,0.19)",
                color: selected ? "#fff" : "var(--text-color)",
                border: selected
                  ? "2px solid #4A90E2"
                  : "1.5px solid var(--border-color)",
                boxShadow: selected
                  ? "0 0 12px 2px #14e6ef33"
                  : "none",
                borderRadius: 8,
                padding: "11px 20px",
                fontWeight: 600,
                fontSize: "1.1rem",
                outline: selected
                  ? "2.5px solid #5fdfff66"
                  : undefined,
                transition: "all 0.13s"
              }}
              onClick={() => handleToggle(filter.value)}
              tabIndex={0}
            >
              <span style={{ fontSize: "1.28em", marginRight: 10 }}>
                {filter.icon}
              </span>
              {filter.label}
            </button>
          );
        })}
      </div>
      <div
        style={{
          fontSize: "0.97rem",
          marginTop: 14,
          color: "var(--text-secondary)"
        }}
      >
        Select {selectionMode === "multiple" ? "one or more" : "one"} filter
        {selectionMode === "multiple" ? "s" : ""} to apply effects on your voice. (Demo only)
      </div>
    </div>
  );
}

export default FilterSelector;
