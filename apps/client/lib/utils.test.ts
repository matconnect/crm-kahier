import { describe, expect, it } from "vitest";

import { cn } from "./utils";

describe("cn", () => {
    it.each([
        [["px-2", "py-1"], "px-2 py-1"],
        [["px-2", false && "hidden", "py-1"], "px-2 py-1"],
        [["text-sm", { "font-bold": true, hidden: false }], "text-sm font-bold"],
        [["px-2", "px-4"], "px-4"],
        [["text-slate-500", "text-red-500"], "text-red-500"],
        [["hover:bg-white", "hover:bg-black"], "hover:bg-black"],
        [["rounded-md", undefined, null, "border"], "rounded-md border"],
        [["flex", ["items-center", "gap-2"]], "flex items-center gap-2"],
    ])("fusionne les classes %#", (input, expected) => {
        expect(cn(...input)).toBe(expected);
    });
});
