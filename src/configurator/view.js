/**
 * Front-end: boot the engine and build the control panel for each block.
 */
import { createConfigurator } from '../engine/configurator-engine';

const runtime = window.steilCfgRuntime || { rest: '', nonce: '', i18n: {} };
const t = ( key, fallback ) =>
	( runtime.i18n && runtime.i18n[ key ] ) || fallback;

const el = ( tag, className, text ) => {
	const node = document.createElement( tag );
	if ( className ) {
		node.className = className;
	}
	if ( text != null ) {
		node.textContent = text;
	}
	return node;
};

function buildPanel( root, data, engine ) {
	const cfg = data.config;
	const panel = root.querySelector( '.steil-cfg__panel' );
	panel.innerHTML = '';

	// One row per configurable part.
	cfg.parts.forEach( ( part ) => {
		const row = el( 'div', 'steil-cfg__row' );
		const header = el( 'div', 'steil-cfg__row-head' );
		header.appendChild( el( 'span', 'steil-cfg__label', part.label ) );
		const swatches = el( 'div', 'steil-cfg__swatches' );

		// Optional parts get an on/off switch; when off the part is hidden and
		// its swatches are disabled.
		const reflectVisible = ( on ) => {
			row.classList.toggle( 'is-off', ! on );
			swatches
				.querySelectorAll( '.steil-cfg__swatch' )
				.forEach( ( s ) => {
					s.disabled = ! on;
				} );
		};

		if ( part.optional ) {
			const on = engine.getState().visible[ part.key ] !== false;
			const toggle = el( 'button', 'steil-cfg__toggle' );
			toggle.type = 'button';
			toggle.setAttribute( 'role', 'switch' );
			toggle.setAttribute( 'aria-checked', on ? 'true' : 'false' );
			toggle.setAttribute( 'aria-label', part.label );
			toggle.classList.toggle( 'is-on', on );
			toggle.addEventListener( 'click', () => {
				const next = ! toggle.classList.contains( 'is-on' );
				engine.setVisible( part.key, next );
				toggle.classList.toggle( 'is-on', next );
				toggle.setAttribute( 'aria-checked', next ? 'true' : 'false' );
				reflectVisible( next );
			} );
			header.appendChild( toggle );
		}

		row.appendChild( header );

		part.palette.forEach( ( swatch ) => {
			const btn = el( 'button', 'steil-cfg__swatch' );
			btn.type = 'button';
			btn.style.background = swatch.hex;
			btn.title = swatch.name;
			btn.setAttribute( 'aria-label', `${ part.label }: ${ swatch.name }` );
			if ( engine.getState().parts[ part.key ] === swatch.name ) {
				btn.classList.add( 'is-active' );
			}
			btn.addEventListener( 'click', () => {
				engine.setColor( part.key, swatch.name );
				swatches
					.querySelectorAll( '.steil-cfg__swatch' )
					.forEach( ( s ) => s.classList.remove( 'is-active' ) );
				btn.classList.add( 'is-active' );
			} );
			swatches.appendChild( btn );
		} );
		row.appendChild( swatches );
		if ( part.optional ) {
			reflectVisible( engine.getState().visible[ part.key ] !== false );
		}
		panel.appendChild( row );
	} );

	// Finish selector.
	const order = cfg.finish_order || Object.keys( cfg.finishes || {} );
	if ( data.showFinish && order.length > 1 ) {
		const row = el( 'div', 'steil-cfg__row' );
		row.appendChild( el( 'span', 'steil-cfg__label', t( 'finish', 'Finish' ) ) );
		const group = el( 'div', 'steil-cfg__finish' );
		order.forEach( ( key ) => {
			const finish = cfg.finishes[ key ];
			if ( ! finish ) {
				return;
			}
			const btn = el( 'button', 'steil-cfg__chip', finish.label || key );
			btn.type = 'button';
			if ( engine.getState().finish === key ) {
				btn.classList.add( 'is-active' );
			}
			btn.addEventListener( 'click', () => {
				engine.setFinish( key );
				group
					.querySelectorAll( '.steil-cfg__chip' )
					.forEach( ( c ) => c.classList.remove( 'is-active' ) );
				btn.classList.add( 'is-active' );
			} );
			group.appendChild( btn );
		} );
		row.appendChild( group );
		panel.appendChild( row );
	}

	// Actions: reset + quote.
	const actions = el( 'div', 'steil-cfg__actions' );
	if ( data.showReset ) {
		const reset = el( 'button', 'steil-cfg__btn steil-cfg__btn--ghost', t( 'reset', 'Reset' ) );
		reset.type = 'button';
		reset.addEventListener( 'click', () => {
			engine.reset();
			buildPanel( root, data, engine ); // refresh active states
		} );
		actions.appendChild( reset );
	}
	if ( data.enableQuote && runtime.rest ) {
		const quote = el( 'button', 'steil-cfg__btn steil-cfg__btn--primary', t( 'requestQuote', 'Request a quote' ) );
		quote.type = 'button';
		quote.addEventListener( 'click', () => openQuoteForm( root, data, engine ) );
		actions.appendChild( quote );
	}
	if ( actions.childNodes.length ) {
		panel.appendChild( actions );
	}
}

function currentSelection( data, engine ) {
	const state = engine.getState();
	const selection = {};
	data.config.parts.forEach( ( part ) => {
		if ( part.optional && state.visible[ part.key ] === false ) {
			selection[ part.label ] = t( 'notIncluded', 'Not included' );
			return;
		}
		selection[ part.label ] = state.parts[ part.key ];
	} );
	const finish =
		data.config.finishes &&
		data.config.finishes[ state.finish ] &&
		data.config.finishes[ state.finish ].label;
	if ( finish ) {
		selection[ t( 'finish', 'Finish' ) ] = finish;
	}
	return selection;
}

function openQuoteForm( root, data, engine ) {
	if ( document.querySelector( '.steil-cfg__modal' ) ) {
		return;
	}

	// Capture the screenshot now, while the current view is on screen.
	let screenshot = '';
	try {
		screenshot = engine.screenshot();
	} catch ( err ) {
		screenshot = '';
	}

	const overlay = el( 'div', 'steil-cfg__modal' );
	const dialog = el( 'div', 'steil-cfg__dialog' );
	dialog.setAttribute( 'role', 'dialog' );
	dialog.setAttribute( 'aria-modal', 'true' );

	const closeBtn = el( 'button', 'steil-cfg__modal-close' );
	closeBtn.type = 'button';
	closeBtn.innerHTML = '&times;';
	closeBtn.setAttribute( 'aria-label', t( 'cancel', 'Cancel' ) );
	dialog.appendChild( closeBtn );

	dialog.appendChild(
		el( 'h3', 'steil-cfg__dialog-title', t( 'requestQuote', 'Request a quote' ) )
	);

	// Selection summary.
	const summary = el( 'div', 'steil-cfg__summary' );
	summary.appendChild( el( 'span', 'steil-cfg__summary-head', t( 'yourSelection', 'Your selection' ) ) );
	const selection = currentSelection( data, engine );
	Object.keys( selection ).forEach( ( key ) => {
		const item = el( 'div', 'steil-cfg__summary-item' );
		item.appendChild( el( 'span', 'steil-cfg__summary-key', key ) );
		item.appendChild( el( 'span', 'steil-cfg__summary-val', selection[ key ] ) );
		summary.appendChild( item );
	} );
	dialog.appendChild( summary );

	const form = el( 'form', 'steil-cfg__quote' );

	const nameInput = el( 'input', 'steil-cfg__input' );
	nameInput.type = 'text';
	nameInput.name = 'name';
	nameInput.placeholder = t( 'name', 'Name' );
	nameInput.required = true;

	const emailInput = el( 'input', 'steil-cfg__input' );
	emailInput.type = 'email';
	emailInput.name = 'email';
	emailInput.placeholder = t( 'email', 'Email' );
	emailInput.required = true;

	const messageInput = el( 'textarea', 'steil-cfg__input' );
	messageInput.name = 'message';
	messageInput.placeholder = t( 'message', 'Message (optional)' );
	messageInput.rows = 3;

	// Honeypot (hidden from humans).
	const honey = el( 'input' );
	honey.type = 'text';
	honey.name = 'website';
	honey.tabIndex = -1;
	honey.autocomplete = 'off';
	honey.style.position = 'absolute';
	honey.style.left = '-9999px';
	honey.setAttribute( 'aria-hidden', 'true' );

	const submit = el( 'button', 'steil-cfg__btn steil-cfg__btn--primary', t( 'send', 'Send request' ) );
	submit.type = 'submit';

	const status = el( 'p', 'steil-cfg__status' );

	form.append( nameInput, emailInput, messageInput, honey, submit, status );
	dialog.appendChild( form );
	overlay.appendChild( dialog );
	document.body.appendChild( overlay );
	requestAnimationFrame( () => overlay.classList.add( 'is-open' ) );
	nameInput.focus();

	const close = () => {
		overlay.classList.remove( 'is-open' );
		document.removeEventListener( 'keydown', onKey );
		setTimeout( () => overlay.remove(), 220 );
	};
	const onKey = ( e ) => {
		if ( e.key === 'Escape' ) {
			close();
		}
	};
	document.addEventListener( 'keydown', onKey );
	overlay.addEventListener( 'click', ( e ) => {
		if ( e.target === overlay ) {
			close();
		}
	} );
	closeBtn.addEventListener( 'click', close );

	form.addEventListener( 'submit', async ( e ) => {
		e.preventDefault();
		submit.disabled = true;
		status.textContent = t( 'sending', 'Sending…' );

		try {
			const res = await fetch( runtime.rest + 'quote', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-WP-Nonce': runtime.nonce,
				},
				body: JSON.stringify( {
					product_id: data.product,
					name: nameInput.value,
					email: emailInput.value,
					message: messageInput.value,
					website: honey.value,
					selection,
					screenshot,
				} ),
			} );
			if ( ! res.ok ) {
				throw new Error( 'bad status' );
			}
			form.remove();
			summary.remove();
			dialog.appendChild(
				el( 'p', 'steil-cfg__status is-ok', t( 'thanks', 'Thanks! We will get back to you soon.' ) )
			);
		} catch ( err ) {
			submit.disabled = false;
			status.textContent = t( 'error', 'Something went wrong. Please try again.' );
		}
	} );
}

function initBlock( root ) {
	const dataNode = root.querySelector( '.steil-cfg__data' );
	const canvas = root.querySelector( '.steil-cfg__canvas' );
	const loading = root.querySelector( '.steil-cfg__loading' );
	if ( ! dataNode || ! canvas ) {
		return;
	}

	let data;
	try {
		data = JSON.parse( dataNode.textContent );
	} catch ( err ) {
		return;
	}
	const cfg = data.config;

	const engine = createConfigurator( canvas, {
		modelUrl: cfg.model_url,
		parts: cfg.parts,
		finishes: cfg.finishes,
		defaultFinish: cfg.default_finish,
		background: cfg.background,
	} );

	engine.ready
		.then( () => {
			if ( loading ) {
				loading.remove();
			}
			buildPanel( root, data, engine );
		} )
		.catch( () => {
			if ( loading ) {
				loading.textContent = t( 'loadError', 'The 3D model could not be loaded.' );
				loading.classList.add( 'is-error' );
			}
		} );
}

function boot() {
	document.querySelectorAll( '.steil-cfg' ).forEach( initBlock );
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', boot );
} else {
	boot();
}
