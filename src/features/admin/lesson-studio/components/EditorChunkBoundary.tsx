import { Component, type ReactNode } from "react";
import { editorChunkFailureTitle } from "./lazyEditorUi";

type State = { failed: boolean };

export default class EditorChunkBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch() { /* Present a controlled message below. */ }
  render() {
    if (this.state.failed) return <section role="alert" className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-amber-950"><h3 className="font-bold">{editorChunkFailureTitle}</h3><p className="mt-2 text-sm">Check your connection and try loading this editor again.</p><button type="button" onClick={() => window.location.reload()} className="mt-4 min-h-11 rounded-xl bg-amber-900 px-4 font-semibold text-white hover:bg-amber-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-900">Try again</button></section>;
    return this.props.children;
  }
}
