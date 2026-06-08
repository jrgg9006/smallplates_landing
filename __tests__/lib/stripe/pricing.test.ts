import {
  BASE_BOOK_PRICE,
  calculateSubtotal,
  calculateExtrasAmount,
  pricePerCopy,
} from '@/lib/stripe/pricing';

describe('pricing — per-person group schedule', () => {
  // Published per-person prices (whole dollars), copies 1–10. Drops through 6,
  // then flat at the $89 floor.
  const PER_PERSON = [169, 129, 113, 103, 95, 89, 89, 89, 89, 89];

  describe('pricePerCopy', () => {
    it('matches the published per-person table for 1–10 copies', () => {
      PER_PERSON.forEach((expected, i) => {
        expect(pricePerCopy(i + 1)).toBe(expected);
      });
    });

    it('decreases through 6 copies, then holds flat at $89', () => {
      for (let n = 2; n <= 6; n++) {
        expect(pricePerCopy(n)).toBeLessThan(pricePerCopy(n - 1));
      }
      for (let n = 7; n <= 10; n++) {
        expect(pricePerCopy(n)).toBe(89);
      }
    });

    it('returns 0 for non-positive quantities', () => {
      expect(pricePerCopy(0)).toBe(0);
      expect(pricePerCopy(-3)).toBe(0);
    });
  });

  describe('calculateSubtotal', () => {
    it('is exactly per-person × copies (no cents, always reconciles)', () => {
      for (let n = 1; n <= 10; n++) {
        expect(calculateSubtotal(n)).toBe(pricePerCopy(n) * n);
      }
    });

    it('matches the agreed totals', () => {
      expect(calculateSubtotal(1)).toBe(169);
      expect(calculateSubtotal(2)).toBe(258);
      expect(calculateSubtotal(3)).toBe(339);
      expect(calculateSubtotal(4)).toBe(412);
      expect(calculateSubtotal(6)).toBe(534);
      expect(calculateSubtotal(10)).toBe(890);
    });

    it('returns 0 for non-positive quantities', () => {
      expect(calculateSubtotal(0)).toBe(0);
      expect(calculateSubtotal(-2)).toBe(0);
    });
  });

  describe('calculateExtrasAmount', () => {
    it('is everything beyond the base book', () => {
      expect(calculateExtrasAmount(1)).toBe(0);
      expect(calculateExtrasAmount(3)).toBe(339 - BASE_BOOK_PRICE); // 170
      expect(calculateExtrasAmount(4)).toBe(412 - BASE_BOOK_PRICE); // 243
    });

    it('plus the base always equals the subtotal (display == charge)', () => {
      for (let n = 1; n <= 10; n++) {
        expect(BASE_BOOK_PRICE + calculateExtrasAmount(n)).toBe(calculateSubtotal(n));
      }
    });
  });
});
