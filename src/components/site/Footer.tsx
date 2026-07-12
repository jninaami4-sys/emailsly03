import { Link } from "@tanstack/react-router";

export function Footer() {
  return (
    <footer className="bg-ink py-20 text-white/70">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-2">
          <div>
            <h3 className="mb-4 font-display text-3xl font-bold text-white">Weekly Intelligence</h3>
            <p className="mb-8 max-w-md text-white/60">
              Get a free batch of 50 verified leads in your industry every Tuesday morning.
            </p>
            <form className="flex max-w-md gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="work@company.com"
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 outline-none focus:border-violet"
              />
              <button
                type="submit"
                className="rounded-xl bg-violet px-6 py-3 font-bold text-white transition-transform hover:scale-[1.02]"
              >
                Join
              </button>
            </form>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm md:grid-cols-3">
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Product</h4>
              <div className="flex flex-col gap-2 text-white/60">
                <Link to="/store" className="hover:text-white">Lead Store</Link>
                <Link to="/apollo-leads-export" className="hover:text-white">Apollo Export</Link>
                <Link to="/linkedin-sales-navigator-leads" className="hover:text-white">LinkedIn</Link>
                <Link to="/zoominfo-leads" className="hover:text-white">ZoomInfo</Link>
                <Link to="/manual-lead-research" className="hover:text-white">Manual Research</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Company</h4>
              <div className="flex flex-col gap-2 text-white/60">
                <Link to="/pricing" className="hover:text-white">Pricing</Link>
                <Link to="/website-design" className="hover:text-white">Website Design</Link>
                <Link to="/contact" className="hover:text-white">Contact</Link>
                <Link to="/track-order" className="hover:text-white">Track Order</Link>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-white">Legal</h4>
              <div className="flex flex-col gap-2 text-white/60">
                <Link to="/privacy-policy" className="hover:text-white">Privacy</Link>
                <Link to="/terms" className="hover:text-white">Terms</Link>
                <Link to="/refund-policy" className="hover:text-white">Refunds</Link>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-20 flex flex-col gap-4 border-t border-white/5 pt-8 text-xs text-white/30 md:flex-row md:justify-between">
          <span>© {new Date().getFullYear()} LYRADATA INC. ALL RIGHTS RESERVED.</span>
          <div className="flex gap-6 italic underline underline-offset-4">
            <Link to="/privacy-policy">Privacy Protocol</Link>
            <Link to="/terms">Terms of Service</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
