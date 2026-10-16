import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import "../styles/pages/OlvidarContrasenia.css"

const LONGITUD_CODIGO = 6
const MIN_CONTRASENIA = 6
const REGEX_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const MSG_SERVIDOR = "No pudimos conectar con el servidor. Intente nuevamente."

/* DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND */
// "Base de datos" falsa: estos son los únicos emails que "existen".
const EMAILS_FALSOS_EN_BD = [
  "admin@escuela.com",
  "preceptor@escuela.com",
  "profesor@escuela.com",
  "alumno@escuela.com",
]
// Token falso que el backend devolvería al verificar el código
const TOKEN_RESET_FALSO = "token-de-prueba"
// Código falso vigente. En la vida real lo genera y guarda el backend.
// Arranca en 123456; cada vez que se aprieta "Reenviar código" cambia
// a uno nuevo y se muestra en la consola del navegador (F12).
let codigoFalsoVigente = "123456"
const generarCodigoFalso = () =>
  String(Math.floor(100000 + Math.random() * 900000))
// Simula el tiempo de espera de una llamada al servidor
const esperar = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
/* FIN DE LOS DATOS FALSOS (lo de arriba se borra al conectar el backend) */

/* =====================================================================
   ZONA BACKEND
   Las 4 funciones de abajo usan DATOS FALSOS (ver el bloque de arriba).
   Las líneas falsas dentro de cada función están marcadas con el comentario
   "DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND".
   Para conectar el backend: borrar esas líneas, poner la llamada real
   (fetch / axios) y respetar lo que devuelve cada función. El resto del
   componente no necesita cambios.
   Si la llamada falla (error de red / 500), la función debe lanzar un
   error (throw): el componente muestra MSG_SERVIDOR.
   ===================================================================== */

/**
 * PASO 1 - Verificar que el email exista y enviarle el código.
 * TODO BACKEND: ej. POST /api/auth/olvide-contrasenia  { email }
 *   1) Buscar el email en la base de datos.
 *   2) Si NO existe -> devolver { existe: false }
 *      (el componente muestra "Este email no es válido para cambiar contraseña").
 *   3) Si existe -> generar el código de 6 dígitos, guardarlo con fecha de
 *      vencimiento, enviarlo por email y devolver { existe: true }.
 */
async function solicitarCodigoPorEmail(email) {
  /* DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND */
  await esperar(800)
  const existe = EMAILS_FALSOS_EN_BD.includes(email)
  if (existe) {
    codigoFalsoVigente = "123456"
    console.log(`[DATO FALSO] Código enviado a ${email}: ${codigoFalsoVigente}`)
  }
  return { existe }
}

/**
 * PASO 2 (botón "Reenviar código") - Generar y enviar un código nuevo.
 * TODO BACKEND: ej. POST /api/auth/reenviar-codigo  { email }
 *   Invalidar el código anterior y enviar uno nuevo.
 *   Recomendado: limitar la cantidad de reenvíos por tiempo (rate limit).
 */
async function reenviarCodigo(email) {
  /* DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND */
  await esperar(800)
  codigoFalsoVigente = generarCodigoFalso()
  console.log(
    `[DATO FALSO] Nuevo código enviado a ${email}: ${codigoFalsoVigente}`
  )
  return { ok: true }
}

/**
 * PASO 2 (botón "Verificar código") - Validar el código ingresado.
 * TODO BACKEND: ej. POST /api/auth/verificar-codigo  { email, codigo }
 *   Comparar el código con el guardado para ese email y revisar que no esté
 *   vencido. Devolver { valido: true, tokenReset: "..." } o { valido: false }.
 *   tokenReset es un token temporal que se usa en el paso 3 para autorizar el
 *   cambio de contraseña (así nadie puede saltarse la verificación).
 */
async function verificarCodigoEnviado(email, codigo) {
  /* DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND */
  await esperar(800)
  return codigo === codigoFalsoVigente
    ? { valido: true, tokenReset: TOKEN_RESET_FALSO }
    : { valido: false }
}

/**
 * PASO 3 - Guardar la nueva contraseña.
 * TODO BACKEND: ej. POST /api/auth/cambiar-contrasenia  { email, tokenReset, nuevaContrasenia }
 *   Validar el tokenReset, hashear la contraseña (bcrypt o similar) y
 *   actualizarla en la base de datos. Invalidar el token y el código usados.
 *   Devolver { ok: true }.
 */
async function guardarNuevaContrasenia(email, tokenReset, nuevaContrasenia) {
  /* DATO FALSO BORRAR LO SIGUIENTE SI VAS A CONECTAR A BACKEND */
  await esperar(800)
  if (tokenReset !== TOKEN_RESET_FALSO) throw new Error("Token inválido")
  console.log(`[DATO FALSO] Contraseña de ${email} cambiada a: ${nuevaContrasenia}`)
  return { ok: true }
}

/* ===================================================================== */

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

  // Al llegar al paso del código, enfoca el primer cuadro
  useEffect(() => {
    if (paso === "codigo") inputsRef.current[0]?.focus()
  }, [paso])

  /* ---------------- PASO 1: email ---------------- */

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    if (cargando) return

    const emailLimpio = email.trim().toLowerCase()

    if (!emailLimpio) {
      setError("Rellene el formulario para enviar el código")
      return
    }
    if (!REGEX_EMAIL.test(emailLimpio)) {
      setError("Ingrese un email con formato válido, por ejemplo nombre@correo.com")
      return
    }

    setError("")
    setCargando(true)
    try {
      // BACKEND: verifica que el email exista y envía el código
      const { existe } = await solicitarCodigoPorEmail(emailLimpio)

      if (!existe) {
        setError("Este email no es válido para cambiar contraseña")
        return
      }

      setEmail(emailLimpio)
      setPaso("codigo")
    } catch {
      setError(MSG_SERVIDOR)
    } finally {
      setCargando(false)
    }
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
    if (reenviando || cargando) return

    setError("")
    setAviso("")
    setReenviando(true)
    try {
      // BACKEND: genera y envía un código nuevo al email
      await reenviarCodigo(email)

      setDigitos(Array(LONGITUD_CODIGO).fill(""))
      setAviso("Te enviamos un nuevo código.")
      inputsRef.current[0]?.focus()
    } catch {
      setError(MSG_SERVIDOR)
    } finally {
      setReenviando(false)
    }
  }

  const handleCodigoSubmit = async (e) => {
    e.preventDefault()
    if (cargando) return

    const codigo = digitos.join("")

    if (codigo.length < LONGITUD_CODIGO) {
      setError("Complete el formulario con los 6 dígitos del código")
      return
    }

    setError("")
    setAviso("")
    setCargando(true)
    try {
      // BACKEND: valida el código ingresado para este email
      const { valido, tokenReset: token } = await verificarCodigoEnviado(
        email,
        codigo
      )

      if (!valido) {
        setError("El código ingresado no es válido")
        return
      }

      setTokenReset(token)
      setPaso("contrasenia")
    } catch {
      setError(MSG_SERVIDOR)
    } finally {
      setCargando(false)
    }
  }

  /* ---------------- PASO 3: nueva contraseña ---------------- */

  const handleContraseniaSubmit = async (e) => {
    e.preventDefault()
    if (cargando) return

    if (!nueva || !repetir) {
      setError("Rellene ambos formularios")
      return
    }
    if (nueva.length < MIN_CONTRASENIA) {
      setError("La contraseña debe tener un mínimo de 6 dígitos")
      return
    }
    if (nueva !== repetir) {
      setError("Ambas contraseñas no coinciden")
      return
    }

    setError("")
    setCargando(true)
    try {
      // BACKEND: guarda la nueva contraseña (usa el token del paso 2)
      await guardarNuevaContrasenia(email, tokenReset, nueva)

      setCambiada(true)
    } catch {
      setError(MSG_SERVIDOR)
    } finally {
      setCargando(false)
    }
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
      <p className="olvidar-error" role="alert">
        {error}
      </p>
    )}

    <button
      className="olvidar-submit"
      type="submit"
      disabled={cargando}
    >
      {cargando ? "Enviando..." : "Enviar código"}
    </button>

    {/* Ruta "/" = pantalla de Log In */}
    <Link className="olvidar-back" to="/">
      Volver al inicio de sesión
    </Link>
  </form>
)}

          {/* ===== PASO 2: ingresar el código ===== */}
          {paso === "codigo" && (
            <form
              className="olvidar-step"
              onSubmit={handleCodigoSubmit}
              noValidate
            >
              <h1 className="olvidar-title">
                Te hemos enviado un código al siguiente email: {email}
              </h1>

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
                    disabled={cargando}
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
              {aviso && <p className="olvidar-info">{aviso}</p>}

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
            </form>
          )}

          {/* ===== PASO 3: nueva contraseña ===== */}
          {paso === "contrasenia" && (
            <form
              className="olvidar-step"
              onSubmit={handleContraseniaSubmit}
              noValidate
            >
              <h1 className="olvidar-title">
                {cambiada
                  ? "Contraseña actualizada"
                  : "Ya puedes cambiar la contraseña"}
              </h1>

              {cambiada ? (
                <>
                  <p className="olvidar-success">
                    Se ha cambiado la contraseña correctamente
                  </p>
                  {/* Ruta "/" = pantalla de Log In */}
                  <Link className="olvidar-submit olvidar-submit--link" to="/">
                    Volver al Log In
                  </Link>
                </>
              ) : (
                <>
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