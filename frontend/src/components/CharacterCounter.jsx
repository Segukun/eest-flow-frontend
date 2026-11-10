import "../styles/components/character-counter.css";

export default function CharacterCounter({ id, value, maxLength }) {
  return <small id={id} className="character-counter">{value.length} / {maxLength}</small>;
}
