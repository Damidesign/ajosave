import { render, screen } from "@testing-library/react";
import { CircleCard } from "../CircleCard";
import type { Circle, Member, CircleStatus } from "@/types";

// Mock next/link so href renders as a plain <a>
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

// The component accesses circle.contributionNgn at runtime even though
// the canonical type uses contributionFiat. Cast via unknown to satisfy TS.
const baseCircle = {
  id: "circle-1",
  name: "Lagos Monthly Ajo",
  creatorId: "user-1",
  contributionUsdc: "10.0000000",
  // Runtime field the component reads
  contributionNgn: 16_000,
  // Type-compatible aliases
  contributionFiat: 16_000,
  contributionCurrency: "NGN",
  maxMembers: 5,
  cycleFrequency: "monthly",
  payoutMethod: "fixed",
  status: "open" as CircleStatus,
  currentCycle: 0,
  nextPayoutAt: undefined,
  createdAt: new Date("2025-01-01"),
  updatedAt: new Date("2025-01-01"),
} as unknown as Circle;

const makeMember = (id: string): Member => ({
  id,
  circleId: "circle-1",
  userId: `user-${id}`,
  position: 1,
  status: "active",
  hasReceivedPayout: false,
  joinedAt: new Date("2025-01-01"),
});

describe("CircleCard", () => {
  describe("renders core information", () => {
    it("displays the circle name", () => {
      render(<CircleCard circle={baseCircle} members={[]} />);
      expect(screen.getByText("Lagos Monthly Ajo")).toBeInTheDocument();
    });

    it("displays cycle frequency", () => {
      render(<CircleCard circle={baseCircle} members={[]} />);
      expect(screen.getByText(/monthly/i)).toBeInTheDocument();
    });

    it("displays member count", () => {
      const members = [makeMember("a"), makeMember("b")];
      render(<CircleCard circle={baseCircle} members={members} />);
      expect(screen.getByText(/2 \/ 5 members/i)).toBeInTheDocument();
    });

    it("displays the next payout date when provided", () => {
      const circle = {
        ...baseCircle,
        nextPayoutAt: new Date("2025-06-15"),
      } as unknown as Circle;
      render(<CircleCard circle={circle} members={[]} />);
      expect(screen.getByText(/jun 15, 2025/i)).toBeInTheDocument();
    });

    it("does not display next payout when not set", () => {
      render(<CircleCard circle={baseCircle} members={[]} />);
      expect(screen.queryByText(/next payout/i)).not.toBeInTheDocument();
    });

    it("renders a progress bar with correct aria attributes", () => {
      const members = [makeMember("a"), makeMember("b")];
      render(<CircleCard circle={baseCircle} members={members} />);
      const bar = screen.getByRole("progressbar");
      expect(bar).toHaveAttribute("aria-valuenow", "2");
      expect(bar).toHaveAttribute("aria-valuemax", "5");
    });
  });

  describe("status badge", () => {
    const statuses: CircleStatus[] = ["open", "active", "completed", "cancelled"];

    statuses.forEach((status) => {
      it(`renders the "${status}" status badge`, () => {
        const circle = { ...baseCircle, status } as unknown as Circle;
        render(<CircleCard circle={circle} members={[]} />);
        expect(screen.getByText(status.charAt(0).toUpperCase() + status.slice(1))).toBeInTheDocument();
      });
    });
  });

  describe("join button visibility", () => {
    it("shows Join button when showJoin=true, status=open, and spots are available", () => {
      render(<CircleCard circle={baseCircle} members={[makeMember("a")]} showJoin />);
      expect(screen.getByRole("link", { name: /join circle/i })).toBeInTheDocument();
    });

    it("join link points to the correct circle join URL", () => {
      render(<CircleCard circle={baseCircle} members={[]} showJoin />);
      expect(screen.getByRole("link", { name: /join circle/i })).toHaveAttribute(
        "href",
        "/circles/circle-1/join"
      );
    });

    it("shows singular 'spot' when only 1 spot remains", () => {
      const members = [makeMember("a"), makeMember("b"), makeMember("c"), makeMember("d")];
      render(<CircleCard circle={baseCircle} members={members} showJoin />);
      expect(screen.getByRole("link", { name: /1 spot left/i })).toBeInTheDocument();
    });

    it("shows plural 'spots' when multiple spots remain", () => {
      render(<CircleCard circle={baseCircle} members={[makeMember("a")]} showJoin />);
      expect(screen.getByRole("link", { name: /4 spots left/i })).toBeInTheDocument();
    });

    it("hides Join button when circle is full (spotsLeft = 0)", () => {
      const members = [
        makeMember("a"), makeMember("b"), makeMember("c"), makeMember("d"), makeMember("e"),
      ];
      render(<CircleCard circle={baseCircle} members={members} showJoin />);
      expect(screen.queryByRole("link", { name: /join circle/i })).not.toBeInTheDocument();
    });

    it("hides Join button when status is 'active'", () => {
      const circle = { ...baseCircle, status: "active" as CircleStatus } as unknown as Circle;
      render(<CircleCard circle={circle} members={[]} showJoin />);
      expect(screen.queryByRole("link", { name: /join circle/i })).not.toBeInTheDocument();
    });

    it("hides Join button when status is 'completed'", () => {
      const circle = { ...baseCircle, status: "completed" as CircleStatus } as unknown as Circle;
      render(<CircleCard circle={circle} members={[]} showJoin />);
      expect(screen.queryByRole("link", { name: /join circle/i })).not.toBeInTheDocument();
    });

    it("hides Join button when status is 'cancelled'", () => {
      const circle = { ...baseCircle, status: "cancelled" as CircleStatus } as unknown as Circle;
      render(<CircleCard circle={circle} members={[]} showJoin />);
      expect(screen.queryByRole("link", { name: /join circle/i })).not.toBeInTheDocument();
    });

    it("hides Join button when showJoin=false regardless of status and spots", () => {
      render(<CircleCard circle={baseCircle} members={[]} showJoin={false} />);
      expect(screen.queryByRole("link", { name: /join circle/i })).not.toBeInTheDocument();
    });
  });

  describe("View Details button", () => {
    it("shows View Details link when showJoin=false", () => {
      render(<CircleCard circle={baseCircle} members={[]} />);
      expect(screen.getByRole("link", { name: /view details/i })).toBeInTheDocument();
    });

    it("View Details link points to the correct circle URL", () => {
      render(<CircleCard circle={baseCircle} members={[]} />);
      expect(screen.getByRole("link", { name: /view details/i })).toHaveAttribute(
        "href",
        "/circles/circle-1"
      );
    });

    it("does not show View Details link when showJoin=true", () => {
      render(<CircleCard circle={baseCircle} members={[]} showJoin />);
      expect(screen.queryByRole("link", { name: /view details/i })).not.toBeInTheDocument();
    });
  });
});
