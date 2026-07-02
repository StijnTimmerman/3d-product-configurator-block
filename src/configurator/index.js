/**
 * Block registration (editor side).
 */
import { registerBlockType } from '@wordpress/blocks';

import Edit from './edit';
import icon from './icon';
import metadata from './block.json';
import './editor.scss';
import './style.scss';

registerBlockType( metadata.name, {
	icon, // Custom 3D-cube icon, overrides the "art" dashicon in block.json.
	edit: Edit,
	save: () => null, // Dynamic block: rendered by render.php.
} );
