function VisaIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" role="img" aria-label="Visa">
      <rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e7eb" />
      <text
        x="24"
        y="20.5"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontStyle="italic"
        fontWeight="800"
        fontSize="12"
        letterSpacing="0.5"
        fill="#1A1F71"
      >
        VISA
      </text>
    </svg>
  );
}

function MastercardIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" role="img" aria-label="Mastercard">
      <rect width="48" height="32" rx="4" fill="#fff" stroke="#e5e7eb" />
      <circle cx="20" cy="16" r="9" fill="#EB001B" />
      <circle cx="28" cy="16" r="9" fill="#F79E1B" />
      <path d="M24 7.94 A9 9 0 0 0 24 24.06 A9 9 0 0 0 24 7.94 Z" fill="#FF5F00" />
    </svg>
  );
}

function AmexIcon() {
  return (
    <svg viewBox="0 0 48 32" className="h-8 w-auto" role="img" aria-label="American Express">
      <rect width="48" height="32" rx="4" fill="#006FCF" />
      <text
        x="24"
        y="20"
        textAnchor="middle"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="800"
        fontSize="9"
        letterSpacing="1"
        fill="#fff"
      >
        AMEX
      </text>
    </svg>
  );
}

function ApplePayIcon() {
  return (
    <svg viewBox="0 0 56 32" className="h-8 w-auto" role="img" aria-label="Apple Pay">
      <rect width="56" height="32" rx="4" fill="#000" />
      <g transform="translate(10 7.5) scale(0.7)">
        <path
          fill="#fff"
          d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.03 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.702"
        />
      </g>
      <text
        x="28"
        y="21"
        fontFamily="ui-sans-serif, system-ui, sans-serif"
        fontWeight="600"
        fontSize="11"
        fill="#fff"
      >
        Pay
      </text>
    </svg>
  );
}

export const PAYMENT_METHODS = [
  { name: "Visa", Icon: VisaIcon },
  { name: "Mastercard", Icon: MastercardIcon },
  { name: "American Express", Icon: AmexIcon },
  { name: "Apple Pay", Icon: ApplePayIcon },
];

export function PaymentIcons() {
  return (
    <ul className="flex items-center gap-2" aria-label="Accepted payment methods">
      {PAYMENT_METHODS.map(({ name, Icon }) => (
        <li key={name} title={name}>
          <Icon />
        </li>
      ))}
    </ul>
  );
}
