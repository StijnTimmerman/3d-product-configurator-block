<?php
/**
 * Server render for the configurator block.
 *
 * @package SteilConfigurator
 *
 * @var array    $attributes Block attributes.
 * @var string   $content    Inner content.
 * @var WP_Block $block      Block instance.
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

$steil_cfg_product_id = isset( $attributes['productId'] ) ? (int) $attributes['productId'] : 0;

// Fall back to the first available product when none is chosen.
if ( $steil_cfg_product_id <= 0 ) {
	$steil_cfg_first = get_posts(
		array(
			'post_type'      => \SteilConfigurator\Product_CPT::POST_TYPE,
			'posts_per_page' => 1,
			'fields'         => 'ids',
		)
	);
	$steil_cfg_product_id = ! empty( $steil_cfg_first ) ? (int) $steil_cfg_first[0] : 0;
}

$steil_cfg_config = $steil_cfg_product_id ? \SteilConfigurator\Product_Store::get_config( $steil_cfg_product_id ) : null;

if ( ! $steil_cfg_config || empty( $steil_cfg_config['parts'] ) || empty( $steil_cfg_config['model_url'] ) ) {
	if ( current_user_can( 'edit_posts' ) ) {
		echo '<div ' . get_block_wrapper_attributes() . '><p class="steil-cfg__notice">' // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
			. esc_html__( 'Configurator: select a configured product with a model and parts.', 'steil-3d-configurator' )
			. '</p></div>';
	}
	return;
}

$steil_cfg_height   = isset( $attributes['height'] ) ? max( 240, (int) $attributes['height'] ) : 520;
$steil_cfg_position = ( isset( $attributes['controlsPosition'] ) && 'bottom' === $attributes['controlsPosition'] ) ? 'bottom' : 'side';

$steil_cfg_data = array(
	'product'     => $steil_cfg_product_id,
	'config'      => $steil_cfg_config,
	'showFinish'  => ! empty( $attributes['showFinish'] ),
	'showReset'   => ! empty( $attributes['showReset'] ),
	'enableQuote' => ! empty( $attributes['enableQuote'] ),
);

// Optional inline CSS-variable overrides from the styling attributes. Anything
// left empty falls back to the stylesheet default.
$steil_cfg_vars  = array();
$steil_cfg_color = static function ( $key, $var ) use ( &$steil_cfg_vars, $attributes ) {
	if ( empty( $attributes[ $key ] ) ) {
		return;
	}
	$hex = \SteilConfigurator\Product_Store::sanitize_hex( $attributes[ $key ] );
	if ( $hex ) {
		$steil_cfg_vars[] = $var . ':' . $hex;
	}
};
$steil_cfg_color( 'accentColor', '--steil-accent' );
$steil_cfg_color( 'textColor', '--steil-ink' );
$steil_cfg_color( 'panelColor', '--steil-surface' );
$steil_cfg_color( 'mutedColor', '--steil-surface-2' );
$steil_cfg_color( 'lineColor', '--steil-line' );

if ( ! empty( $attributes['stageBackground'] ) ) {
	if ( 'transparent' === $attributes['stageBackground'] ) {
		$steil_cfg_vars[] = '--steil-stage:transparent';
	} else {
		$steil_cfg_stage_hex = \SteilConfigurator\Product_Store::sanitize_hex( $attributes['stageBackground'] );
		if ( $steil_cfg_stage_hex ) {
			$steil_cfg_vars[] = '--steil-stage:' . $steil_cfg_stage_hex;
		}
	}
}
if ( ! empty( $attributes['cornerRadius'] ) ) {
	$steil_cfg_vars[] = '--steil-radius:' . (int) $attributes['cornerRadius'] . 'px';
}
if ( ! empty( $attributes['gap'] ) ) {
	$steil_cfg_vars[] = '--steil-gap:' . (int) $attributes['gap'] . 'px';
}
if ( ! empty( $attributes['panelWidth'] ) ) {
	$steil_cfg_vars[] = '--steil-panel-w:' . (int) $attributes['panelWidth'] . 'px';
}
$steil_cfg_shapes = array(
	'pill'    => '999px',
	'rounded' => '12px',
	'square'  => '4px',
);
if ( ! empty( $attributes['buttonShape'] ) && isset( $steil_cfg_shapes[ $attributes['buttonShape'] ] ) ) {
	$steil_cfg_vars[] = '--steil-btn-radius:' . $steil_cfg_shapes[ $attributes['buttonShape'] ];
}
$steil_cfg_shadows = array(
	'none'   => 'none',
	'soft'   => '0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.06)',
	'strong' => '0 2px 6px rgba(0,0,0,0.08), 0 18px 40px rgba(0,0,0,0.14)',
);
if ( ! empty( $attributes['shadow'] ) && isset( $steil_cfg_shadows[ $attributes['shadow'] ] ) ) {
	$steil_cfg_vars[] = '--steil-shadow:' . $steil_cfg_shadows[ $attributes['shadow'] ];
}

$steil_cfg_wrapper_args = array(
	'class'         => 'steil-cfg steil-cfg--' . $steil_cfg_position,
	'data-position' => $steil_cfg_position,
);
if ( $steil_cfg_vars ) {
	$steil_cfg_wrapper_args['style'] = implode( ';', $steil_cfg_vars );
}
$steil_cfg_wrapper = get_block_wrapper_attributes( $steil_cfg_wrapper_args );
?>
<div <?php echo $steil_cfg_wrapper; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>>
	<div class="steil-cfg__stage" style="height:<?php echo esc_attr( $steil_cfg_height ); ?>px">
		<canvas class="steil-cfg__canvas" aria-label="<?php echo esc_attr( $steil_cfg_config['title'] ); ?>"></canvas>
		<div class="steil-cfg__loading"><?php echo esc_html__( 'Loading 3D model…', 'steil-3d-configurator' ); ?></div>
	</div>
	<div class="steil-cfg__panel" aria-live="polite"></div>
	<script type="application/json" class="steil-cfg__data">
		<?php echo wp_json_encode( $steil_cfg_data ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
	</script>
</div>
