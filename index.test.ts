import { beforeAll, afterAll, afterEach, describe, test, expect } from "vitest";
import { setupServer } from "msw/node";
import { HttpResponse, http } from "msw";

import { jwtVerify, createRemoteJWKSet } from "jose";

const JWKS_URI = "https://example.com/.well-known/jwks.json";

const openIdHandlers = [
  http.get(JWKS_URI, () => {
    return HttpResponse.json({
      keys: [
        {
          kty: "RSA",
          e: "AQAB",
          use: "sig",
          kid: "example",
          alg: "RS256",
          n: "tZqSBMWZs5yoq8-eM1HZS6aSXlzIoqGZThSpYnsEX57kB1meKZwwtKdivbg9iZZdArkT_ujq3iH0ygZg3dhcW97fzHNGkcZJhc82G9pVLSq69V8D3OKB45HodAQnrJoV-c66eZwtRmwC2jZ5a-wb3F1OpNU8jNDAeFcA4Ig-tWdITcmN16XDT4SIqx8s4PPQH-adF93u4H1svTRucNJwyZJl-W4xaS8DaGiQjb2xrXbsVmAx-QEPykbG5L5_3jK2IWZXaAuRDmiCtJB4H0x9e12Q-ULniRJvyB4y1SwWemuvnqMOeviUdDmKBMsa3TXl27b7g61KjzOQHne6NiLPVQ",
        },
      ],
    });
  }),
];

const server = setupServer(...openIdHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

afterAll(() => server.close());

afterEach(() => server.resetHandlers());

server.events.on("request:start", ({ request }) => {
  console.log("MSW intercepted:", request.method, request.url);
});

const token =
  "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImV4YW1wbGUifQ.eyJpc3MiOiJodHRwczovL2V4YW1wbGUuY29tLyIsImlhdCI6MTcxNDcwMjc0OSwiZXhwIjoxNzQ2MjM4Nzc2LCJhdWQiOiJodHRwczovL2xvY2FsaG9zdDo4ODg4LyIsInN1YiI6ImFsZXguYmFsZHdpbkBuZXRsaWZ5LmNvbSIsInNjb3BlIjoib3BlbmlkIHByb2ZpbGUgZW1haWwifQ.oydVIP7wzY1WPDus-jyfBhd1hdKOAgb8mGrI1vBkiyai72fT6wsae31yYwPP8f-t7eDidp8CnjOfHbZBPWmaDAjW1h6L__iXt_tW3MtJwSEEK6mBWIL6F7v3WX99bukneZdCOMfKI59LbyDR9J8QOTLp0xbsqlOm09fUR1EW-lgu0ukOXnvz9QR500OMSCiWbEuEkxOjGzPDOJERElNJxLCsj4_sZRdQhyLLGIlmMxkLoxrfzqyowVQF_8ZU3JKudR0fD38Jt7UOfYj-S3Gu8OO7y90KfXyfzkFgiNSt16l0xOx3zNL2G__t6nbgDo_OUTKwoogSVCWhSfkRGSzG8Q";

test("fetches issuer JSON Web Key Set", async () => {
  const jwks = createRemoteJWKSet(new URL(JWKS_URI));
  const { payload } = await jwtVerify(token, jwks, {
    issuer: "https://example.com/",
  });
  expect(payload).toBeDefined();
  expect(payload.sub).toEqual("alex.baldwin@netlify.com");
});
