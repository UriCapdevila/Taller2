export default function ErrorMessage({ message }) {
  return (
    <div className="state-wrap">
      <div className="error-box" role="alert" aria-live="assertive">
        <h2>Error al cargar los datos</h2>
        <p>{message}</p>
      </div>
    </div>
  );
}
