/**
 * Custom block icon: an isometric 3D cube with subtly shaded faces.
 *
 * Monochrome (uses currentColor) so it follows the editor's icon colour,
 * with per-face opacity to read as a 3D object even at small sizes.
 */
const icon = (
	<svg
		width="24"
		height="24"
		viewBox="0 0 24 24"
		xmlns="http://www.w3.org/2000/svg"
		aria-hidden="true"
		focusable="false"
	>
		{ /* top face */ }
		<path d="M12 2 21 7 12 12 3 7Z" fill="currentColor" />
		{ /* left face */ }
		<path d="M3 7 12 12 12 22 3 17Z" fill="currentColor" opacity="0.55" />
		{ /* right face */ }
		<path d="M21 7 12 12 12 22 21 17Z" fill="currentColor" opacity="0.8" />
	</svg>
);

export default icon;
