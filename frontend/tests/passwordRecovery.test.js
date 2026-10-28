import assert from "node:assert/strict";
import { afterEach, mock, test } from "node:test";
import api from "../src/api.js";
import {
  esTokenInvalido,
  guardarNuevaContrasenia,
  mensajeErrorRecuperacion,
  reenviarCodigo,
  solicitarCodigoPorEmail,
  validarContrasenia,
  validarEmail,
  verificarCodigoEnviado,
} from "../src/services/passwordRecovery.js";

afterEach(() => {
  mock.restoreAll();
  delete globalThis.window;
  delete globalThis.localStorage;
});

test("valida correo vacío, mal formado y válido", () => {
  assert.ok(validarEmail(""));
  for (const email of ["sin-arroba", "a@", "a b@ejemplo.com", "a@ejemplo"]) {
    assert.ok(validarEmail(email));
  }
  assert.equal(validarEmail("persona@ejemplo.com"), "");
});

test("valida confirmación y límites reales de 6 a 64 caracteres", () => {
  assert.ok(validarContrasenia("", ""));
  assert.ok(validarContrasenia("abcde", "abcde"));
  assert.match(validarContrasenia("abcdef", "ghijkl"), /no coinciden/);
  assert.ok(validarContrasenia("a".repeat(65), "a".repeat(65)));
  assert.equal(validarContrasenia("a".repeat(6), "a".repeat(6)), "");
  assert.equal(validarContrasenia("a".repeat(64), "a".repeat(64)), "");
});

const email = "persona@ejemplo.com";
const scenarios = [
  ["solicita un código para correo registrado", solicitarCodigoPorEmail, [email],
    "forgot-password", { email }, { existe: true }],
  ["respeta correo no registrado", solicitarCodigoPorEmail, [email],
    "forgot-password", { email }, { existe: false }],
  ["reenvía el código", reenviarCodigo, [email],
    "resend-code", { email }, { ok: true }],
  ["respeta reenvío con correo inexistente", reenviarCodigo, [email],
    "resend-code", { email }, { ok: false }],
  ["verifica código correcto y usa resetToken", verificarCodigoEnviado, [email, "123456"],
    "verify-code", { email, code: "123456" }, { valido: true, resetToken: "fixture-only" }],
  ["respeta código incorrecto o vencido", verificarCodigoEnviado, [email, "000000"],
    "verify-code", { email, code: "000000" }, { valido: false }],
  ["restablece con los nombres reales del contrato", guardarNuevaContrasenia,
    [email, "fixture-only", "fixture-password"], "reset-password",
    { email, resetToken: "fixture-only", newPassword: "fixture-password" }, { ok: true }],
];

for (const [name, action, args, path, body, data] of scenarios) {
  test(name, async () => {
    const post = mock.method(api, "post", async () => ({ data }));
    const { signal } = new AbortController();
    assert.deepEqual(await action(...args, signal), data);
    assert.deepEqual(post.mock.calls[0].arguments, [
      `/api/auth/${path}`, body, { signal, timeout: 15000 },
    ]);
    assert.equal(post.mock.callCount(), 1);
  });
}

const unexpected = [
  ["forgot sin indicador", solicitarCodigoPorEmail, [email], {}],
  ["forgot con tipo incorrecto", solicitarCodigoPorEmail, [email], { existe: "false" }],
  ["forgot sin cuerpo", solicitarCodigoPorEmail, [email], null],
  ["reenvío inesperado", reenviarCodigo, [email], "<html>error</html>"],
  ["verificación sin token", verificarCodigoEnviado, [email, "123456"], { valido: true }],
  ["verificación con token vacío", verificarCodigoEnviado, [email, "123456"],
    { valido: true, resetToken: " " }],
  ["verificación sin indicador", verificarCodigoEnviado, [email, "123456"], {}],
  ["restablecimiento sin confirmación", guardarNuevaContrasenia,
    [email, "fixture-only", "fixture-password"], {}],
  ["restablecimiento negativo no documentado", guardarNuevaContrasenia,
    [email, "fixture-only", "fixture-password"], { ok: false }],
];

for (const [name, action, args, data] of unexpected) {
  test(`rechaza respuesta inesperada: ${name}`, async () => {
    mock.method(api, "post", async () => ({ data }));
    await assert.rejects(action(...args), { code: "INVALID_RECOVERY_RESPONSE" });
  });
}

test("propaga errores de red y cancelaciones sin convertirlos en éxito", async () => {
  for (const code of ["ERR_NETWORK", "ERR_CANCELED", "ECONNABORTED"]) {
    const error = Object.assign(new Error("fixture"), { code });
    mock.method(api, "post", async () => { throw error; });
    await assert.rejects(solicitarCodigoPorEmail(email), (actual) => actual === error);
    mock.restoreAll();
  }
});

test("identifica únicamente el error real de token inválido o vencido", () => {
  const response = { status: 400, data: { message: "Invalid or expired reset token" } };
  assert.equal(esTokenInvalido({ response }), true);
  assert.equal(esTokenInvalido({ response: { ...response, status: 500 } }), false);
  assert.equal(esTokenInvalido({ response: { status: 400, data: {} } }), false);
  assert.match(mensajeErrorRecuperacion({ response }), /Solicite un nuevo código/);
});

test("distingue red, timeout, validación, servidor y respuestas inesperadas sin filtrar detalles", () => {
  assert.match(mensajeErrorRecuperacion({}), /conectar/);
  assert.match(mensajeErrorRecuperacion({ code: "ECONNABORTED" }), /tardó demasiado/);
  assert.match(mensajeErrorRecuperacion({ code: "ETIMEDOUT" }), /tardó demasiado/);
  assert.match(mensajeErrorRecuperacion({ code: "INVALID_RECOVERY_RESPONSE" }), /inesperada/);
  assert.match(mensajeErrorRecuperacion({ response: { status: 400 } }), /datos enviados/);
  const error = {
    response: { status: 500, data: { message: "private-fixture" } },
    config: { data: "private-fixture" },
  };
  assert.match(mensajeErrorRecuperacion(error), /más tarde/);
  assert.ok(!mensajeErrorRecuperacion(error).includes("private-fixture"));
});

test("el interceptor no redirige la recuperación ante HTTP 401 en variantes de la ruta", async () => {
  const interceptor = api.interceptors.response.handlers[0].rejected;
  globalThis.localStorage = { removeItem() {} };
  for (const pathname of ["/olvidarContrasenia", "/OlvidarContrasenia", "/olvidarContrasenia/"]) {
    globalThis.window = { location: { pathname, href: "sin-cambio" } };
    await assert.rejects(interceptor({ response: { status: 401 } }));
    assert.equal(window.location.href, "sin-cambio");
  }
  globalThis.window = { location: { pathname: "/equipo", href: "sin-cambio" } };
  await assert.rejects(interceptor({ response: { status: 401 } }));
  assert.equal(window.location.href, "/login");
});
