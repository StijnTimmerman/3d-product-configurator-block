/**
 * Framework-agnostic 3D configurator engine.
 *
 * Generalised from the open-source mini-configurator core (MIT, Steil Digital):
 * instead of building a fixed chair from primitives, it loads a GLB model and
 * recolours named "parts" by sharing a material across the meshes that match
 * each part. It knows nothing about WordPress or the DOM controls — the block's
 * view script builds the UI from the config and drives the scene through this API.
 *
 * createConfigurator(canvas, config) -> {
 *   ready,                       // Promise resolved once the model is in the scene
 *   setColor(partKey, name),
 *   setFinish(name),
 *   reset(),
 *   getState(),                  // { parts: {key: colourName}, finish }
 *   onChange(fn),                // subscribe; returns unsubscribe
 *   screenshot(),                // PNG data URL of the current view
 *   dispose(),
 * }
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { loadModel } from './load-model';

const hexToInt = ( hex ) => parseInt( String( hex ).replace( '#', '' ), 16 ) || 0x999999;

const colourOf = ( part, name ) => {
	const swatch =
		part.palette.find( ( c ) => c.name === name ) || part.palette[ 0 ];
	return swatch ? hexToInt( swatch.hex ) : 0x999999;
};

/**
 * Decide which part (if any) a mesh belongs to.
 *
 * @param {THREE.Mesh} mesh  The mesh.
 * @param {Array}      parts Configured parts.
 * @return {Object|null} Matching part or null.
 */
function partForMesh( mesh, parts ) {
	const haystacks = [
		mesh.name,
		mesh.material && mesh.material.name,
		mesh.parent && mesh.parent.name,
	]
		.filter( Boolean )
		.map( ( s ) => s.toLowerCase() );

	for ( const part of parts ) {
		const needles =
			part.match && part.match.length ? part.match : [ part.key ];
		for ( const needle of needles ) {
			const n = String( needle ).toLowerCase();
			if ( haystacks.some( ( h ) => h.includes( n ) ) ) {
				return part;
			}
		}
	}
	return null;
}

export function createConfigurator( canvas, config ) {
	const parts = Array.isArray( config.parts ) ? config.parts : [];
	const finishes = config.finishes || {};
	const finishKeys = Object.keys( finishes );
	const defaultFinish =
		config.defaultFinish && finishes[ config.defaultFinish ]
			? config.defaultFinish
			: finishKeys[ 0 ] || 'matte';

	const initialVisible = ( p ) => ( p.optional ? p.default_on !== false : true );

	const state = { parts: {}, finish: defaultFinish, visible: {}, textures: {} };
	parts.forEach( ( p ) => {
		state.parts[ p.key ] =
			p.default || ( p.palette[ 0 ] && p.palette[ 0 ].name ) || '';
		state.visible[ p.key ] = initialVisible( p );
		state.textures[ p.key ] = p.default_texture || null;
	} );

	const listeners = new Set();
	const emit = () => listeners.forEach( ( fn ) => fn( getState() ) );
	const getState = () => ( {
		parts: { ...state.parts },
		finish: state.finish,
		visible: { ...state.visible },
		textures: { ...state.textures },
	} );

	const renderer = new THREE.WebGLRenderer( {
		canvas,
		antialias: true,
		alpha: config.background === 'transparent',
		preserveDrawingBuffer: true,
	} );
	renderer.setPixelRatio( Math.min( window.devicePixelRatio, 2 ) );
	renderer.toneMapping = THREE.ACESFilmicToneMapping;
	renderer.toneMappingExposure = 1.05;
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	const scene = new THREE.Scene();
	if ( config.background && config.background !== 'transparent' ) {
		scene.background = new THREE.Color( hexToInt( config.background ) );
	}

	const pmrem = new THREE.PMREMGenerator( renderer );
	const envRT = pmrem.fromScene( new RoomEnvironment(), 0.04 );
	scene.environment = envRT.texture;

	const camera = new THREE.PerspectiveCamera( 40, 1, 0.01, 1000 );
	camera.position.set( 2, 1.5, 2.6 );

	const controls = new OrbitControls( camera, canvas );
	controls.enableDamping = true;
	controls.enablePan = false;
	controls.maxPolarAngle = Math.PI / 2 - 0.03;

	// Auto-framing keeps the model fitted as the canvas is sized/resized, but
	// stops fighting the visitor the moment they grab the model.
	let userInteracted = false;
	controls.addEventListener( 'start', () => {
		userInteracted = true;
	} );

	scene.add( new THREE.HemisphereLight( 0xffffff, 0x9a9aa5, 0.35 ) );
	const key = new THREE.DirectionalLight( 0xffffff, 2.1 );
	key.position.set( 3, 5, 2 );
	key.castShadow = true;
	key.shadow.mapSize.set( 2048, 2048 );
	key.shadow.bias = -0.0004;
	scene.add( key );

	const ground = new THREE.Mesh(
		new THREE.PlaneGeometry( 200, 200 ),
		new THREE.ShadowMaterial( { opacity: 0.22 } )
	);
	ground.rotation.x = -Math.PI / 2;
	ground.receiveShadow = true;
	scene.add( ground );

	// One shared material per part; meshes of a part point at it so a single
	// colour/finish change updates every mesh. partMeshes tracks the meshes so
	// a whole part can be shown/hidden.
	const partMaterials = {};
	const partMeshes = {};
	// The model's own base map per part, so clearing a chosen texture can put
	// the original surface back.
	const originalMap = {};

	const applyVisible = ( partKey, on ) => {
		( partMeshes[ partKey ] || [] ).forEach( ( mesh ) => {
			mesh.visible = on;
		} );
	};
	const makeMaterial = ( part, source ) => {
		const mat = new THREE.MeshStandardMaterial( {
			color: colourOf( part, state.parts[ part.key ] ),
			envMapIntensity: 0.7,
		} );
		if ( source ) {
			// Preserve texture detail from the model where present.
			[ 'map', 'normalMap', 'roughnessMap', 'aoMap' ].forEach( ( k ) => {
				if ( source[ k ] ) {
					mat[ k ] = source[ k ];
				}
			} );
		}
		originalMap[ part.key ] = mat.map || null;
		Object.assign( mat, finishPreset( state.finish ) );
		return mat;
	};

	// Load (and cache) a repeating colour texture from a URL.
	const texLoader = new THREE.TextureLoader();
	const textureCache = {};
	const loadTexture = ( url, repeat ) => {
		if ( ! textureCache[ url ] ) {
			const tex = texLoader.load( url );
			tex.wrapS = THREE.RepeatWrapping;
			tex.wrapT = THREE.RepeatWrapping;
			tex.colorSpace = THREE.SRGBColorSpace;
			tex.repeat.set( repeat || 1, repeat || 1 );
			textureCache[ url ] = tex;
		}
		return textureCache[ url ];
	};

	// Put a part's material in the state it should be: a chosen texture (colour
	// washed to white so the texture reads true) or its selected colour.
	const refreshAppearance = ( part ) => {
		const mat = partMaterials[ part.key ];
		if ( ! mat ) {
			return;
		}
		const texName = state.textures[ part.key ];
		const texDef =
			texName &&
			( part.textures || [] ).find( ( t ) => t.name === texName );
		if ( texDef && texDef.url ) {
			mat.map = loadTexture( texDef.url, texDef.repeat );
			mat.color.setHex( 0xffffff );
		} else {
			mat.map = originalMap[ part.key ] || null;
			mat.color.setHex( colourOf( part, state.parts[ part.key ] ) );
		}
		mat.needsUpdate = true;
	};

	function finishPreset( name ) {
		const f = finishes[ name ] || {};
		return {
			roughness: typeof f.roughness === 'number' ? f.roughness : 0.6,
			metalness: typeof f.metalness === 'number' ? f.metalness : 0.0,
		};
	}

	// Framing data, filled once the model is centred on the ground.
	let frameData = null;
	const FIT_MARGIN = 1.2; // Breathing room around the model.

	function centreAndMeasure( object ) {
		const box = new THREE.Box3().setFromObject( object );
		const size = box.getSize( new THREE.Vector3() );
		const center = box.getCenter( new THREE.Vector3() );

		// Drop the model onto the ground and centre it horizontally.
		object.position.x -= center.x;
		object.position.z -= center.z;
		object.position.y -= box.min.y;

		const sphere = box.getBoundingSphere( new THREE.Sphere() );
		frameData = {
			radius: sphere.radius || 1,
			target: new THREE.Vector3( 0, size.y * 0.5, 0 ),
			dir: new THREE.Vector3( 0.55, 0.4, 1 ).normalize(),
		};
	}

	// Position the camera so the whole model fits. A wide canvas is limited by
	// the vertical FOV, a tall one by the horizontal FOV — fit to whichever is
	// tighter, using the bounding sphere so no orientation clips.
	function fitCamera() {
		if ( ! frameData ) {
			return;
		}
		const { radius, target, dir } = frameData;
		const vFov = ( camera.fov * Math.PI ) / 180;
		const hFov = 2 * Math.atan( Math.tan( vFov / 2 ) * camera.aspect );
		const fitFov = Math.min( vFov, hFov );
		const dist = ( radius / Math.sin( fitFov / 2 ) ) * FIT_MARGIN;

		controls.target.copy( target );
		camera.position.copy( target ).add( dir.clone().multiplyScalar( dist ) );
		controls.minDistance = radius * 0.6;
		controls.maxDistance = dist * 4;
		controls.update();
	}

	let model = null;
	let raf = 0;

	const resize = () => {
		const w = canvas.clientWidth;
		const h = canvas.clientHeight;
		if ( w && h && ( canvas.width !== w || canvas.height !== h ) ) {
			renderer.setSize( w, h, false );
			camera.aspect = w / h;
			camera.updateProjectionMatrix();
			// Refit while the visitor hasn't taken control (covers the initial
			// 0-size → real-size step and the block being widened).
			if ( ! userInteracted ) {
				fitCamera();
			}
		}
	};

	const tick = () => {
		raf = requestAnimationFrame( tick );
		resize();
		controls.update();
		renderer.render( scene, camera );
	};

	const ready = loadModel( config.modelUrl ).then( ( root ) => {
		model = root;
		model.traverse( ( node ) => {
			if ( ! node.isMesh ) {
				return;
			}
			node.castShadow = true;
			node.receiveShadow = true;
			const part = partForMesh( node, parts );
			if ( part ) {
				if ( ! partMaterials[ part.key ] ) {
					partMaterials[ part.key ] = makeMaterial(
						part,
						Array.isArray( node.material )
							? node.material[ 0 ]
							: node.material
					);
				}
				node.material = partMaterials[ part.key ];
				( partMeshes[ part.key ] ||
					( partMeshes[ part.key ] = [] ) ).push( node );
			}
		} );
		// Apply the initial per-part visibility (optional parts may start off)
		// and any default texture.
		parts.forEach( ( p ) => {
			applyVisible( p.key, state.visible[ p.key ] );
			refreshAppearance( p );
		} );
		scene.add( model );
		centreAndMeasure( model );
		fitCamera();
		tick();
		return api;
	} );

	window.addEventListener( 'resize', resize );

	const api = {
		ready,
		setColor( partKey, name ) {
			const part = parts.find( ( p ) => p.key === partKey );
			if ( ! part || ! partMaterials[ partKey ] ) {
				return;
			}
			state.parts[ partKey ] = name;
			// Choosing a colour clears any texture on this part.
			state.textures[ partKey ] = null;
			refreshAppearance( part );
			emit();
		},
		setTexture( partKey, name ) {
			const part = parts.find( ( p ) => p.key === partKey );
			if ( ! part || ! partMaterials[ partKey ] ) {
				return;
			}
			state.textures[ partKey ] = name || null;
			refreshAppearance( part );
			emit();
		},
		setFinish( name ) {
			if ( ! finishes[ name ] ) {
				return;
			}
			state.finish = name;
			Object.values( partMaterials ).forEach( ( mat ) =>
				Object.assign( mat, finishPreset( name ) )
			);
			emit();
		},
		setVisible( partKey, on ) {
			if ( ! ( partKey in state.visible ) ) {
				return;
			}
			state.visible[ partKey ] = !! on;
			applyVisible( partKey, !! on );
			emit();
		},
		reset() {
			parts.forEach( ( p ) => {
				state.parts[ p.key ] =
					p.default || ( p.palette[ 0 ] && p.palette[ 0 ].name ) || '';
				state.textures[ p.key ] = p.default_texture || null;
				state.visible[ p.key ] = initialVisible( p );
				applyVisible( p.key, state.visible[ p.key ] );
				refreshAppearance( p );
			} );
			this.setFinish( defaultFinish );
		},
		getState,
		onChange( fn ) {
			listeners.add( fn );
			return () => listeners.delete( fn );
		},
		screenshot() {
			renderer.render( scene, camera );
			return renderer.domElement.toDataURL( 'image/png' );
		},
		dispose() {
			cancelAnimationFrame( raf );
			window.removeEventListener( 'resize', resize );
			controls.dispose();
			envRT.dispose();
			pmrem.dispose();
			renderer.dispose();
			listeners.clear();
		},
	};

	return api;
}
