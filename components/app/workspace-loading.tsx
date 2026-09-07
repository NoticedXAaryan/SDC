import type { CSSProperties } from "react";

export function WorkspaceLoading({ fullPage = false }: { fullPage?: boolean }) {
  return <div className={`club-loading ${fullPage ? "club-loading-page" : ""}`} aria-busy="true">
    <div className="club-loading-identity" role="status">
      <span className="club-monogram" aria-hidden="true">sdc<span>.</span></span>
      <div className="club-loading-caption"><span className="club-matrix" aria-hidden="true">{Array.from({ length: 16 }, (_, index) => <i key={index} style={{ "--dot-delay": `${index % 4 * 120}ms` } as CSSProperties} />)}</span><span>Getting things ready</span></div>
    </div>
    <div className="club-loading-layout" aria-hidden="true">
      <div className="club-loading-line club-loading-heading" /><div className="club-loading-line club-loading-subtitle" />
      <div className="club-loading-feature"><div className="club-loading-line" /><div className="club-loading-line club-loading-subtitle" /><div className="club-loading-action" /></div>
      <div className="club-loading-columns">{[0, 1].map(index => <div key={index} className="club-loading-card"><div className="club-loading-line" />{[0, 1, 2].map(row => <div key={row} className="club-loading-row"><span /><div><div className="club-loading-line" /><div className="club-loading-line club-loading-subtitle" /></div></div>)}</div>)}</div>
    </div>
  </div>;
}
