import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  LONGITUD_CODIGO,
  MAX_CONTRASENIA,
  MIN_CONTRASENIA,
  esTokenInvalido,
  guardarNuevaContrasenia,
  mensajeErrorRecuperacion,
  reenviarCodigo,
  solicitarCodigoPorEmail,
  validarContrasenia,
  validarEmail,
  verificarCodigoEnviado,
} from "../services/passwordRecovery.js"
import "../styles/pages/OlvidarContrasenia.css"

/* Input de contraseña con el "ojito" adentro para mostrar / ocultar.
   Cada instancia guarda su propio estado, así que cada input se
   muestra u oculta de forma independiente. Los íconos son SVG en línea
   (no hace falta instalar nada ni tener imágenes). */
const InputContrasenia = ({ value, onChange, disabled }) => {
  const [visible, setVisible] = useState(false)

  return (
    <div className="olvidar-password">
      <input
        className="olvidar-field__input olvidar-password__input"
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        minLength={MIN_CONTRASENIA}
        maxLength={MAX_CONTRASENIA}
        required
        value={value}
        disabled={disabled}
        onChange={onChange}
      />
      <button
        className="olvidar-password__toggle"
        type="button"
        disabled={disabled}
        aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
        aria-pressed={visible}
        onClick={() => setVisible((v) => !v)}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          {!visible ? (
            <>
              {/* ojo TACHADO = contraseña oculta (puntitos), click para mostrar */}
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </>
          ) : (
            <>
              {/* ojo SIN tachar = contraseña visible, click para ocultar */}
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </>
          )}
        </svg>
      </button>
    </div>
  )
}

const OlvidarContrasenia = () => {
  // "email" -> "codigo" -> "contrasenia"
  const [paso, setPaso] = useState("email")

  const [email, setEmail] = useState("")
  const [digitos, setDigitos] = useState(Array(LONGITUD_CODIGO).fill(""))
  const [tokenReset, setTokenReset] = useState("")
  const [nueva, setNueva] = useState("")
  const [repetir, setRepetir] = useState("")

  const [error, setError] = useState("")
  const [aviso, setAviso] = useState("")
  const [cargando, setCargando] = useState(false)
  const [reenviando, setReenviando] = useState(false)
  const [cambiada, setCambiada] = useState(false)

  const inputsRef = useRef([])
  const solicitudRef = useRef(null)

  useEffect(() => () => solicitudRef.current?.abort(), [])

  // Al llegar al paso del código, enfoca el primer cuadro
  useEffect(() => {
    if (paso === "codigo" && !cargando && !reenviando) {
      inputsRef.current[0]?.focus()
    }
  }, [paso, cargando, reenviando])

  const limpiarRecuperacion = () => {
    setEmail("")
    setDigitos(Array(LONGITUD_CODIGO).fill(""))
    setTokenReset("")
    setNueva("")
    setRepetir("")
    setError("")
    setAviso("")
  }

  const reiniciarRecuperacion = () => {
    if (solicitudRef.current) return
    limpiarRecuperacion()
    setCambiada(false)
    setPaso("email")
  }

  // El ref bloquea también dos eventos disparados antes del próximo render.
  const ejecutarSolicitud = async (accion, esReenvio = false) => {
    if (solicitudRef.current) return
    const controller = new AbortController()
    solicitudRef.current = controller
    setError("")
    setAviso("")
    if (esReenvio) setReenviando(true)
    else setCargando(true)

    try {
      await accion(controller.signal)
    } catch (errorSolicitud) {
      if (controller.signal.aborted) return
      if (esTokenInvalido(errorSolicitud)) {
        limpiarRecuperacion()
        setPaso("email")
      }
      setError(mensajeErrorRecuperacion(errorSolicitud))
    } finally {
      solicitudRef.current = null
      if (!controller.signal.aborted) {
        setCargando(false)
        setReenviando(false)
      }
    }
  }

  /* ---------------- PASO 1: email ---------------- */

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (solicitudRef.current) return

    const emailLimpio = email.trim().toLowerCase()

    const errorEmail = validarEmail(emailLimpio)
    if (errorEmail) {
      setError(errorEmail)
      return
    }

    await ejecutarSolicitud(async (signal) => {
      const { existe } = await solicitarCodigoPorEmail(emailLimpio, signal)

      if (!existe) {
        setError("Este email no es válido para cambiar contraseña")
        return
      }

      setEmail(emailLimpio)
      setPaso("codigo")
    })
  }

  /* ---------------- PASO 2: código ---------------- */

  const handleDigitoChange = (index, valor) => {
    const digito = valor.replace(/\D/g, "").slice(-1) // solo números
    const nuevos = [...digitos]
    nuevos[index] = digito
    setDigitos(nuevos)
    setError("")
    setAviso("")

    if (digito && index < LONGITUD_CODIGO - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleDigitoKeyDown = (index, e) => {
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
    setDigitos(nuevos)
    setError("")
    setAviso("")
    inputsRef.current[Math.min(pegado.length, LONGITUD_CODIGO - 1)]?.focus()
  }

  const handleReenviar = async () => {
    if (solicitudRef.current) return

    await ejecutarSolicitud(async (signal) => {
      const { ok } = await reenviarCodigo(email, signal)
      if (!ok) {
        setError("Este email no es válido para cambiar contraseña")
        return
      }

      setDigitos(Array(LONGITUD_CODIGO).fill(""))
      setAviso("Te enviamos un nuevo código.")
    }, true)
  }

  const handleCodigoSubmit = async (e) => {
    e.preventDefault()
    if (solicitudRef.current) return

    const codigo = digitos.join("")

    if (codigo.length < LONGITUD_CODIGO) {
      setError("Complete el formulario con los 6 dígitos del código")
      return
    }

    await ejecutarSolicitud(async (signal) => {
      const { valido, resetToken: token } = await verificarCodigoEnviado(
        email,
        codigo,
        signal
      )

      if (!valido) {
        setError("El código ingresado no es válido o venció. Puede solicitar uno nuevo.")
        return
      }

      setTokenReset(token)
      setDigitos(Array(LONGITUD_CODIGO).fill(""))
      setPaso("contrasenia")
    })
  }

  /* ---------------- PASO 3: nueva contraseña ---------------- */

  const handleContraseniaSubmit = async (e) => {
    e.preventDefault()
    if (solicitudRef.current) return

    const errorContrasenia = validarContrasenia(nueva, repetir)
    if (errorContrasenia) {
      setError(errorContrasenia)
      return
    }

    await ejecutarSolicitud(async (signal) => {
      await guardarNuevaContrasenia(email, tokenReset, nueva, signal)

      limpiarRecuperacion()
      setCambiada(true)
    })
  }

  /* ---------------- Render ---------------- */

  return (
    <main className="admin-login-page">
      <div className="admin-login-overlay"></div>
      <div className="admin-login-content">
        <div className="admin-card olvidar-card">
          {/* ===== PASO 1: pedir el email ===== */}
          {paso === "email" && (
            <form
              className="olvidar-step"
              onSubmit={handleEmailSubmit}
              aria-busy={cargando}
              noValidate
            >
              <div className="olvidar-head">
                <h1 className="olvidar-title">Recuperar contraseña</h1>
                <p className="olvidar-subtitle">
                  Ingrese el email asociado a su cuenta
                </p>
              </div>

              <label className="olvidar-field">
                <span className="olvidar-field__label">Email</span>
                <input
                  className="olvidar-field__input"
                  type="email"
                  placeholder="nombre@correo.com"
                  autoComplete="email"
                  value={email}
                  disabled={cargando}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setError("")
                  }}
                />
              </label>

              {error && (
                <p className="olvidar-error" role="alert">{error}</p>
              )}

              <button
                className="olvidar-submit"
                type="submit"
                disabled={cargando}
              >
                {cargando ? "Enviando..." : "Enviar código"}
              </button>

              <Link className="olvidar-back" to="/login">
                Volver al inicio de sesión
              </Link>
            </form>
          )}

          {/* ===== PASO 2: ingresar el código ===== */}
          {paso === "codigo" && (
            <form
              className="olvidar-step"
              onSubmit={handleCodigoSubmit}
              aria-busy={cargando || reenviando}
              noValidate
            >
              <h1 className="olvidar-title">
                Te hemos enviado un código al siguiente email: {email}
              </h1>
              <p className="olvidar-subtitle">
                Ingrese los 6 dígitos recibidos. El código vence en 10 minutos.
              </p>

              <div className="olvidar-code" onPaste={handlePaste}>
                {digitos.map((digito, i) => (
                  <input
                    key={i}
                    ref={(el) => (inputsRef.current[i] = el)}
                    className={`olvidar-code__input ${
                      error ? "is-error" : ""
                    }`}
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={1}
                    value={digito}
                    disabled={cargando || reenviando}
                    aria-label={`Dígito ${i + 1} del código`}
                    onChange={(e) => handleDigitoChange(i, e.target.value)}
                    onKeyDown={(e) => handleDigitoKeyDown(i, e)}
                    onFocus={(e) => e.target.select()}
                  />
                ))}
              </div>

              {error && (
                <p className="olvidar-error" role="alert">
                  {error}
                </p>
              )}
              {aviso && <p className="olvidar-info" role="status">{aviso}</p>}

              <button
                className="olvidar-resend"
                type="button"
                disabled={reenviando || cargando}
                onClick={handleReenviar}
              >
                {reenviando ? "Reenviando..." : "Reenviar código"}
              </button>

              <button
                className="olvidar-submit"
                type="submit"
                disabled={cargando || reenviando}
              >
                {cargando ? "Verificando..." : "Verificar código"}
              </button>
              <button
                className="olvidar-back"
                type="button"
                disabled={cargando || reenviando}
                onClick={reiniciarRecuperacion}
              >
                Usar otro email
              </button>
              <Link className="olvidar-back" to="/login">
                Volver al inicio de sesión
              </Link>
            </form>
          )}

          {/* ===== PASO 3: nueva contraseña ===== */}
          {paso === "contrasenia" && (
            <form
              className="olvidar-step"
              onSubmit={handleContraseniaSubmit}
              aria-busy={cargando}
              noValidate
            >
              <h1 className="olvidar-title">
                {cambiada
                  ? "Contraseña actualizada"
                  : "Ya puedes cambiar la contraseña"}
              </h1>

              {cambiada ? (
                <>
                  <p className="olvidar-success" role="status">
                    Se ha cambiado la contraseña correctamente
                  </p>
                  <Link className="olvidar-submit olvidar-submit--link" to="/login">
                    Volver al Log In
                  </Link>
                </>
              ) : (
                <>
                  <p className="olvidar-subtitle">
                    La contraseña debe tener entre 6 y 64 caracteres.
                  </p>
                  <label className="olvidar-field">
                    <span className="olvidar-field__label">
                      Nueva contraseña
                    </span>
                    <InputContrasenia
                      value={nueva}
                      disabled={cargando}
                      onChange={(e) => {
                        setNueva(e.target.value)
                        setError("")
                      }}
                    />
                  </label>

                  <label className="olvidar-field">
                    <span className="olvidar-field__label">
                      Reescriba la nueva contraseña
                    </span>
                    <InputContrasenia
                      value={repetir}
                      disabled={cargando}
                      onChange={(e) => {
                        setRepetir(e.target.value)
                        setError("")
                      }}
                    />
                  </label>

                  {error && (
                    <p className="olvidar-error" role="alert">
                      {error}
                    </p>
                  )}

                  <button
                    className="olvidar-submit"
                    type="submit"
                    disabled={cargando}
                  >
                    {cargando ? "Cambiando..." : "Cambiar contraseña"}
                  </button>
                  <button
                    className="olvidar-back"
                    type="button"
                    disabled={cargando}
                    onClick={reiniciarRecuperacion}
                  >
                    Solicitar un nuevo código
                  </button>
                  <Link className="olvidar-back" to="/login">
                    Volver al inicio de sesión
                  </Link>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </main>
  )
}

export default OlvidarContrasenia
