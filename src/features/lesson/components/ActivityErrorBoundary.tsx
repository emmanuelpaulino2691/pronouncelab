import { Component, type ErrorInfo, type ReactNode } from "react";

type Props = { children: ReactNode; activityTitle: string };
type State = { failed: boolean };

export default class ActivityErrorBoundary extends Component<Props, State> {
  state: State = { failed: false };
  static getDerivedStateFromError(): State { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Lesson activity rendering failed", { error, info, activity: this.props.activityTitle });
  }
  render() {
    if (this.state.failed) {
      return <div role="alert" className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-900"><h2 className="text-lg font-bold">This activity could not be displayed</h2><p className="mt-2 text-sm">Your lesson progress is safe. Return to the previous activity or reload the page to try again.</p></div>;
    }
    return this.props.children;
  }
}
