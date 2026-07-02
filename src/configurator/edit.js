/**
 * Block editor UI.
 */
import { __ } from '@wordpress/i18n';
import {
	useBlockProps,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
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
	const {
		productId,
		height,
		showFinish,
		showReset,
		enableQuote,
		controlsPosition,
		accentColor,
		textColor,
		panelColor,
		mutedColor,
		lineColor,
		stageBackground,
		cornerRadius,
		gap,
		panelWidth,
		buttonShape,
		shadow,
	} = attributes;
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
				<PanelBody
					title={ __( 'Appearance', 'steil-3d-configurator' ) }
					initialOpen={ false }
				>
					<RangeControl
						label={ __( 'Corner radius (px)', 'steil-3d-configurator' ) }
						value={ cornerRadius }
						min={ 0 }
						max={ 40 }
						onChange={ ( value ) =>
							setAttributes( { cornerRadius: value || 0 } )
						}
						help={ __( '0 = theme default', 'steil-3d-configurator' ) }
						__nextHasNoMarginBottom
					/>
					<RangeControl
						label={ __( 'Gap between 3D and panel (px)', 'steil-3d-configurator' ) }
						value={ gap }
						min={ 0 }
						max={ 64 }
						onChange={ ( value ) => setAttributes( { gap: value || 0 } ) }
						__nextHasNoMarginBottom
					/>
					<RangeControl
						label={ __( 'Panel width (px)', 'steil-3d-configurator' ) }
						value={ panelWidth }
						min={ 0 }
						max={ 480 }
						onChange={ ( value ) =>
							setAttributes( { panelWidth: value || 0 } )
						}
						help={ __( '0 = default (300)', 'steil-3d-configurator' ) }
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Button shape', 'steil-3d-configurator' ) }
						value={ buttonShape }
						options={ [
							{ value: '', label: __( 'Default', 'steil-3d-configurator' ) },
							{ value: 'pill', label: __( 'Pill', 'steil-3d-configurator' ) },
							{ value: 'rounded', label: __( 'Rounded', 'steil-3d-configurator' ) },
							{ value: 'square', label: __( 'Square', 'steil-3d-configurator' ) },
						] }
						onChange={ ( value ) => setAttributes( { buttonShape: value } ) }
						__nextHasNoMarginBottom
					/>
					<SelectControl
						label={ __( 'Shadow', 'steil-3d-configurator' ) }
						value={ shadow }
						options={ [
							{ value: '', label: __( 'Default', 'steil-3d-configurator' ) },
							{ value: 'none', label: __( 'None', 'steil-3d-configurator' ) },
							{ value: 'soft', label: __( 'Soft', 'steil-3d-configurator' ) },
							{ value: 'strong', label: __( 'Strong', 'steil-3d-configurator' ) },
						] }
						onChange={ ( value ) => setAttributes( { shadow: value } ) }
						__nextHasNoMarginBottom
					/>
					<ToggleControl
						label={ __( 'Transparent 3D stage', 'steil-3d-configurator' ) }
						checked={ stageBackground === 'transparent' }
						onChange={ ( value ) =>
							setAttributes( {
								stageBackground: value ? 'transparent' : '',
							} )
						}
						__nextHasNoMarginBottom
					/>
				</PanelBody>
				<PanelColorSettings
					title={ __( 'Colours', 'steil-3d-configurator' ) }
					initialOpen={ false }
					colorSettings={ [
						{
							value: accentColor,
							onChange: ( value ) =>
								setAttributes( { accentColor: value || '' } ),
							label: __( 'Accent (active, buttons)', 'steil-3d-configurator' ),
						},
						{
							value: textColor,
							onChange: ( value ) =>
								setAttributes( { textColor: value || '' } ),
							label: __( 'Text', 'steil-3d-configurator' ),
						},
						{
							value: panelColor,
							onChange: ( value ) =>
								setAttributes( { panelColor: value || '' } ),
							label: __( 'Panel background', 'steil-3d-configurator' ),
						},
						{
							value: mutedColor,
							onChange: ( value ) =>
								setAttributes( { mutedColor: value || '' } ),
							label: __( 'Chips / secondary surface', 'steil-3d-configurator' ),
						},
						{
							value: lineColor,
							onChange: ( value ) =>
								setAttributes( { lineColor: value || '' } ),
							label: __( 'Lines / borders', 'steil-3d-configurator' ),
						},
						{
							value:
								stageBackground === 'transparent'
									? undefined
									: stageBackground,
							onChange: ( value ) =>
								setAttributes( { stageBackground: value || '' } ),
							label: __( '3D stage background', 'steil-3d-configurator' ),
						},
					] }
				/>
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
