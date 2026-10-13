import { useRef, useState } from "react"
import "../styles/pages/OlvidarContrasenia.css"

const LONGITUD_CODIGO = 6
const MIN_CONTRASENIA = 6

// TODO: reemplazar por la llamada real al backend.
// Por ahora el código "correcto" es 123456 para poder probar la pantalla.
const verificarCodigo = async (codigo) => codigo === "123456"

const OlvidarContrasenia = ({ email = "tu@email.com" }) => {
  const [digitos, setDigitos] = useState(Array(LONGITUD_CODIGO).fill(""))
  const [codigoVerificado, setCodigoVerificado] = useState(false)
  const [errorCodigo, setErrorCodigo] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetir, setRepetir] = useState("")
  const [errorContrasenia, setErrorContrasenia] = useState("")
  const inputsRef = useRef([])

  const actualizarDigitos = async (nuevos) => {
    setDigitos(nuevos)
    setErrorCodigo("")

    if (nuevos.every((d) => d !== "")) {
      const esCorrecto = await verificarCodigo(nuevos.join(""))
      if (esCorrecto) {
        setCodigoVerificado(true)
      } else {
        setErrorCodigo("El código ingresado no es correcto.")
      }
    }
  }

  const handleChange = (index, valor) => {
    const digito = valor.replace(/\D/g, "").slice(-1)
    const nuevos = [...digitos]
    nuevos[index] = digito
    actualizarDigitos(nuevos)

    if (digito && index < LONGITUD_CODIGO - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !digitos[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === "ArrowLeft" && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
    if (e.key === "ArrowRight" && index < LONGITUD_CODIGO - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pegado = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LONGITUD_CODIGO)
    if (!pegado) return

    const nuevos = Array(LONGITUD_CODIGO).fill("")
    pegado.split("").forEach((d, i) => {
      nuevos[i] = d
    })
    actualizarDigitos(nuevos)
    inputsRef.current[Math.min(pegado.length, LONGITUD_CODIGO - 1)]?.focus()
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!codigoVerificado) return

    if (nueva.length < MIN_CONTRASENIA || repetir.length < MIN_CONTRASENIA) {
      setErrorContrasenia("La contraseña debe tener mínimo 6 dígitos.")
      return
    }
    if (nueva !== repetir) {
      setErrorContrasenia("Las contraseñas no coinciden.")
      return
    }

    setErrorContrasenia("")
    // TODO: enviar la nueva contraseña al backend y redirigir al login.
  }

  return (
    <main className="admin-login-page">
      <div className="admin-login-overlay"></div>
      <div className="admin-login-content">
        <form className="admin-card olvidar-card" onSubmit={handleSubmit}>
          <h1 className="olvidar-title">
            Te hemos enviado un código al email: {email}
          </h1>

          <div className="olvidar-code" onPaste={handlePaste}>
            {digitos.map((digito, i) => (
              <input
                key={i}
                ref={(el) => (inputsRef.current[i] = el)}
                className={`olvidar-code__input ${
                  errorCodigo ? "is-error" : ""
                } ${codigoVerificado ? "is-ok" : ""}`}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={1}
                value={digito}
                disabled={codigoVerificado}
                aria-label={`Dígito ${i + 1} del código`}
                onChange={(e) => handleChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onFocus={(e) => e.target.select()}
              />
            ))}
          </div>

          {errorCodigo && <p className="olvidar-error">{errorCodigo}</p>}

          <p className="olvidar-hint">
            Una vez verificado que el código escrito sea el correcto, se
            habilitará la opción de cambiar la contraseña.
          </p>

          <label
            className={`olvidar-field ${
              codigoVerificado ? "" : "is-disabled"
            }`}
          >
            <span className="olvidar-field__label">Nueva contraseña</span>
            <input
              className="olvidar-field__input"
              type="password"
              autoComplete="new-password"
              value={nueva}
              disabled={!codigoVerificado}
              onChange={(e) => {
                setNueva(e.target.value)
                setErrorContrasenia("")
              }}
            />
          </label>

          <label
            className={`olvidar-field ${
              codigoVerificado ? "" : "is-disabled"
            }`}
          >
            <span className="olvidar-field__label">
              Repetir la nueva contraseña
            </span>
            <input
              className="olvidar-field__input"
              type="password"
              autoComplete="new-password"
              value={repetir}
              disabled={!codigoVerificado}
              onChange={(e) => {
                setRepetir(e.target.value)
                setErrorContrasenia("")
              }}
            />
          </label>

          {errorContrasenia && (
            <p className="olvidar-error">{errorContrasenia}</p>
          )}

          <button
            className="olvidar-submit"
            type="submit"
            disabled={!codigoVerificado}
          >
            Confirmar contraseña
          </button>
        </form>
      </div>
    </main>
  )
}

export default OlvidarContrasenia