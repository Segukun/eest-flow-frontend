import { FiSearch } from "react-icons/fi";
export default function ForoSearch({ value, onChange }) {
  return (
    <div className="foro-search">
      <FiSearch />
      <input placeholder="Buscar..." value={value} onChange={e=>onChange(e.target.value)} />
    </div>
  );
}
