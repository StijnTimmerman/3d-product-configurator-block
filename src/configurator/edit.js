/**
 * Block editor UI.
 */
import { __ } from '@wordpress/i18n';
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import {
	PanelBody,
	SelectControl,
	RangeControl,
	ToggleControl,
	Notice,
	Spinner,
} from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

import icon from './icon';

export default function Edit( { attributes, setAttributes } ) {
	const { productId, height, showFinish, showReset, enableQuote, controlsPosition } =
		attributes;
	const [ products, setProducts ] = useState( null );

	useEffect( () => {
		apiFetch( { path: 'steil-cfg/v1/products' } )
			.then( ( items ) => setProducts( items || [] ) )
			.catch( () => setProducts( [] ) );
	}, [] );

	const blockProps = useBlockProps( {
		className: 'steil-cfg-editor-card',
		style: { minHeight: height },
	} );

	const selected =
		products && products.find( ( p ) => p.id === productId );

	const productOptions = [
		{ value: 0, label: __( 'Select a product…', 'steil-3d-configurator' ) },
		...( products || [] ).map( ( p ) => ( {
			value: p.id,
			label: p.title,
		} ) ),
	];

	return (
		<>
			<InspectorControls>
				<PanelBody title={ __( 'Product', 'steil-3d-configurator' ) }>
					{ null === products ? (
						<Spinner />
					) : (
						<SelectControl
							label={ __( 'Configurator product', 'steil-3d-configurator' ) }
							value={ productId }
							options={ productOptions }
							onChange={ ( value ) =>
								setAttributes( { productId: parseInt( value, 10 ) } )
							}
							__nextHasNoMarginBottom
						/>
					) }
					{ products && products.length === 0 && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'No configurator products yet. Create one under "3D Configurator".',
								'steil-3d-configurator'
							) }
						</Notice>
					) }
				</PanelBody>
				<PanelBody title={ __( 'Layout', 'steil-3d-configurator' ) }>
					<RangeControl
						label={ __( 'Height (px)', 'steil-3d-configurator' ) }
						value={ height }
						min={ 320 }
						max={ 900 }
						onChange={ ( value ) => setAttributes( { height: value } ) }
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Controls position', 'steil-3d-configurator' ) }
						value={ controlsPosition }
						options={ [
							{ value: 'side', label: __( 'Side', 'steil-3d-configurator' ) },
							{ value: 'bottom', label: __( 'Bottom', 'steil-3d-configurator' ) },
						] }
						onChange={ ( value ) =>
							setAttributes( { controlsPosition: value } )
						}
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show finish selector', 'steil-3d-configurator' ) }
						checked={ showFinish }
						onChange={ ( value ) => setAttributes( { showFinish: value } ) }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Show reset button', 'steil-3d-configurator' ) }
						checked={ showReset }
						onChange={ ( value ) => setAttributes( { showReset: value } ) }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Enable quote request', 'steil-3d-configurator' ) }
						checked={ enableQuote }
						onChange={ ( value ) => setAttributes( { enableQuote: value } ) }
						__nextHasNoMarginBottom
					/>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<div className="steil-cfg-editor-inner">
					<span className="steil-cfg-editor-icon">{ icon }</span>
					<strong>{ __( 'Steil 3D Configurator', 'steil-3d-configurator' ) }</strong>
					{ selected ? (
						<p>
							{ __( 'Product:', 'steil-3d-configurator' ) }{ ' ' }
							<em>{ selected.title }</em>
						</p>
					) : (
						<p>
							{ __(
								'Choose a configurator product in the block settings.',
								'steil-3d-configurator'
							) }
						</p>
					) }
					<p className="steil-cfg-editor-hint">
						{ __(
							'The interactive 3D preview appears on the published page.',
							'steil-3d-configurator'
						) }
					</p>
				</div>
			</div>
		</>
	);
}
