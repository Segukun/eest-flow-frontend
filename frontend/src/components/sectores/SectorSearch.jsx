import { FiSearch } from "react-icons/fi";

export default function SectorSearch({
  value,
  onChange,
}) {
  return (
    <div className="gs-discovery-search">
      <label className="gs-sector-search">
        <FiSearch />

        <input
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar otros sectores..."
          aria-label="Buscar otros sectores"
        />
      </label>
    </div>
  );
}