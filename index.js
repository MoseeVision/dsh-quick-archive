/**
 * Host half of dsh-quick-archive.
 *
 * The capability is presentation-only and lives entirely in the browser: the
 * Client half adds an archive control to the sidebar's session rows and calls
 * the already-published `uiWorkspace` Client service. Nothing is registered on
 * the Host side, so this half stays an empty apply.
 */
export function apply() {}
