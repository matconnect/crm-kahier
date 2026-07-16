import { describe, expect, it } from "vitest";
import { isAllowedOrigin, isPrivateIpv4, normalizeOrigin, requireHttpUrl, splitUrls } from "./config.js";

describe("gateway configuration", () => {
    it.each([
        ["10.0.0.1", true], ["10.255.255.255", true], ["192.168.0.1", true], ["192.168.255.255", true],
        ["172.16.0.1", true], ["172.31.255.255", true], ["172.15.0.1", false], ["172.32.0.1", false],
        ["8.8.8.8", false], ["127.0.0.1", false], ["192.169.0.1", false], ["10.0.0", false],
        ["10.0.0.256", false], ["abc", false], ["", false], ["1.2.3.4.5", false],
    ])("classifies private IPv4 %s", (host, expected) => expect(isPrivateIpv4(host)).toBe(expected));

    it.each([
        ["https://app.test/path", "https://app.test"], ["https://app.test/", "https://app.test"],
        ["http://localhost:3000/a", "http://localhost:3000"], ["http://127.0.0.1:8080", "http://127.0.0.1:8080"],
        ["not a URL/", "not a URL"], ["example.test/", "example.test"], ["https://app.test:443/x", "https://app.test"],
        ["https://app.test?x=1", "https://app.test"],
    ])("normalizes origin %s", (value, expected) => expect(normalizeOrigin(value)).toBe(expected));

    it.each([
        ["http://a.test, https://b.test/", ["http://a.test", "https://b.test"]], [undefined, []],
        [" , ", []], ["a,b,c", ["a", "b", "c"]], ["a/", ["a"]], ["a//", ["a/"]],
        ["http://localhost:3000/", ["http://localhost:3000"]], [",a,,b,", ["a", "b"]],
    ])("splits origins %s", (input, expected) => expect(splitUrls(input)).toEqual(expected));

    it.each([
        ["http://crm.local/", "http://crm.local"], ["https://crm.example.com/api/", "https://crm.example.com/api"],
        ["http://127.0.0.1:3000", "http://127.0.0.1:3000"], ["https://[::1]:3000/", "https://[::1]:3000"],
    ])("accepts HTTP URL %s", (value, expected) => {
        process.env.TEST_URL = value;
        expect(requireHttpUrl("TEST_URL")).toBe(expected);
    });

    it("rejects a missing upstream URL", () => {
        delete process.env.TEST_URL;
        expect(() => requireHttpUrl("TEST_URL")).toThrow("Missing required env");
    });

    it("rejects malformed upstream URL", () => {
        process.env.TEST_URL = "not-a-url";
        expect(() => requireHttpUrl("TEST_URL")).toThrow("Invalid URL");
    });

    it("rejects non HTTP upstream URL", () => {
        process.env.TEST_URL = "ftp://crm.test";
        expect(() => requireHttpUrl("TEST_URL")).toThrow("Invalid URL protocol");
    });

    const configured = new Set(["https://allowed.test"]);
    it.each([
        [undefined, true, true], ["https://allowed.test/path", true, true], ["https://blocked.test", true, false],
        ["http://localhost:3000", true, true], ["http://127.0.0.1:3000", true, true], ["http://[::1]:3000", true, true],
        ["http://service.local", true, true], ["http://10.0.0.4", true, true], ["http://192.168.1.4", true, true],
        ["http://172.20.1.4", true, true], ["http://8.8.8.8", true, false], ["invalid", true, false],
        ["https://blocked.test", false, false], [undefined, false, true], ["https://blocked.test", false, false],
        ["https://allowed.test", false, true], ["https://anything.test", false, false],
    ])("checks origin %s in %s mode", (origin, dev, expected) => {
        expect(isAllowedOrigin(origin, configured, dev)).toBe(expected);
    });
});
