<?php
/**
 * Reads, normalises and sanitises a product's configuration.
 *
 * @package SteilConfigurator
 */

namespace SteilConfigurator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Config schema helper. The same shape is stored in post meta, sent to the
 * editor, and inlined into the block render for the front-end engine.
 */
class Product_Store {

	/**
	 * Resolve a product into a runtime config array for the JS engine.
	 *
	 * @param int $post_id Product post ID.
	 * @return array|null
	 */
	public static function get_config( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || Product_CPT::POST_TYPE !== $post->post_type ) {
			return null;
		}

		$config = get_post_meta( $post_id, Product_CPT::META_KEY, true );
		if ( ! is_array( $config ) ) {
			$config = self::default_config();
		}

		$config['id']        = (int) $post_id;
		$config['title']     = get_the_title( $post_id );
		$config['model_url'] = self::resolve_model_url( $config );

		return $config;
	}

	/**
	 * Resolve the model URL from an attachment id or a marker/explicit URL.
	 *
	 * @param array $config Stored config.
	 * @return string
	 */
	public static function resolve_model_url( $config ) {
		$model_id = isset( $config['model_id'] ) ? (int) $config['model_id'] : 0;
		if ( $model_id > 0 ) {
			$url = wp_get_attachment_url( $model_id );
			if ( $url ) {
				return $url;
			}
		}

		$marker = isset( $config['model_url'] ) ? (string) $config['model_url'] : '';
		if ( 0 === strpos( $marker, 'plugin:' ) ) {
			return STEIL_CFG_URL . ltrim( substr( $marker, 7 ), '/' );
		}
		return $marker ? esc_url_raw( $marker ) : '';
	}

	/**
	 * Empty starting config for a new product.
	 *
	 * @return array
	 */
	public static function default_config() {
		return array(
			'model_id'       => 0,
			'model_url'      => '',
			'parts'          => array(),
			'finishes'       => self::default_finishes(),
			'finish_order'   => array( 'matte', 'satin', 'gloss' ),
			'default_finish' => 'matte',
			'background'     => 'transparent',
		);
	}

	/**
	 * Default finish presets (roughness / metalness).
	 *
	 * @return array
	 */
	public static function default_finishes() {
		return array(
			'matte' => array(
				'label'     => __( 'Matte', 'steil-3d-configurator' ),
				'roughness' => 0.85,
				'metalness' => 0.0,
			),
			'satin' => array(
				'label'     => __( 'Satin', 'steil-3d-configurator' ),
				'roughness' => 0.45,
				'metalness' => 0.05,
			),
			'gloss' => array(
				'label'     => __( 'Gloss', 'steil-3d-configurator' ),
				'roughness' => 0.12,
				'metalness' => 0.1,
			),
		);
	}

	/**
	 * Config for the bundled sample lounge chair.
	 *
	 * @return array
	 */
	public static function sample_config() {
		$frame  = array(
			array(
				'name' => 'Walnut',
				'hex'  => '#6b4a2b',
			),
			array(
				'name' => 'Oak',
				'hex'  => '#c8a06a',
			),
			array(
				'name' => 'Black',
				'hex'  => '#1d1d20',
			),
			array(
				'name' => 'Chalk',
				'hex'  => '#ece9f0',
			),
			array(
				'name' => 'Sage',
				'hex'  => '#8a9a7b',
			),
		);
		$fabric = array(
			array(
				'name' => 'Charcoal',
				'hex'  => '#3a3a40',
			),
			array(
				'name' => 'Sand',
				'hex'  => '#d8c4a0',
			),
			array(
				'name' => 'Terracotta',
				'hex'  => '#bf5f45',
			),
			array(
				'name' => 'Ocean',
				'hex'  => '#3f6f8f',
			),
			array(
				'name' => 'Forest',
				'hex'  => '#39513f',
			),
			array(
				'name' => 'Cream',
				'hex'  => '#e9e1d2',
			),
		);

		$config                = self::default_config();
		$config['model_url']   = 'plugin:assets/models/lounge-chair.glb';
		$config['parts']       = array(
			array(
				'key'     => 'frame',
				'label'   => __( 'Frame', 'steil-3d-configurator' ),
				'match'   => array( 'frame', 'leg' ),
				'palette' => $frame,
				'default' => 'Walnut',
			),
			array(
				'key'     => 'seat',
				'label'   => __( 'Seat', 'steil-3d-configurator' ),
				'match'   => array( 'seat' ),
				'palette' => $fabric,
				'default' => 'Charcoal',
			),
			array(
				'key'     => 'back',
				'label'   => __( 'Backrest', 'steil-3d-configurator' ),
				'match'   => array( 'back' ),
				'palette' => $fabric,
				'default' => 'Charcoal',
			),
		);
		$config['background'] = 'transparent';

		return $config;
	}

	/**
	 * Sanitise a config array coming from the editor.
	 *
	 * @param array $input Raw config.
	 * @return array
	 */
	public static function sanitize_config( $input ) {
		$out = self::default_config();

		$out['model_id'] = isset( $input['model_id'] ) ? absint( $input['model_id'] ) : 0;

		if ( isset( $input['model_url'] ) && 0 === strpos( (string) $input['model_url'], 'plugin:' ) ) {
			$out['model_url'] = sanitize_text_field( $input['model_url'] );
		} elseif ( isset( $input['model_url'] ) ) {
			$out['model_url'] = esc_url_raw( $input['model_url'] );
		}

		$out['parts'] = array();
		if ( isset( $input['parts'] ) && is_array( $input['parts'] ) ) {
			foreach ( $input['parts'] as $part ) {
				if ( empty( $part['key'] ) ) {
					continue;
				}
				$palette = array();
				if ( isset( $part['palette'] ) && is_array( $part['palette'] ) ) {
					foreach ( $part['palette'] as $swatch ) {
						$hex = self::sanitize_hex( isset( $swatch['hex'] ) ? $swatch['hex'] : '' );
						if ( ! $hex ) {
							continue;
						}
						$palette[] = array(
							'name' => sanitize_text_field( isset( $swatch['name'] ) ? $swatch['name'] : $hex ),
							'hex'  => $hex,
						);
					}
				}
				$match = array();
				if ( isset( $part['match'] ) && is_array( $part['match'] ) ) {
					foreach ( $part['match'] as $m ) {
						$m = sanitize_text_field( $m );
						if ( '' !== $m ) {
							$match[] = $m;
						}
					}
				}
				$out['parts'][] = array(
					'key'        => sanitize_key( $part['key'] ),
					'label'      => sanitize_text_field( isset( $part['label'] ) ? $part['label'] : $part['key'] ),
					'match'      => $match,
					'palette'    => $palette,
					'default'    => sanitize_text_field( isset( $part['default'] ) ? $part['default'] : '' ),
					'optional'   => ! empty( $part['optional'] ),
					'default_on' => ! isset( $part['default_on'] ) || (bool) $part['default_on'],
				);
			}
		}

		$out['finishes'] = array();
		$finishes        = isset( $input['finishes'] ) && is_array( $input['finishes'] ) ? $input['finishes'] : self::default_finishes();
		foreach ( $finishes as $key => $finish ) {
			$key = sanitize_key( $key );
			if ( '' === $key ) {
				continue;
			}
			$out['finishes'][ $key ] = array(
				'label'     => sanitize_text_field( isset( $finish['label'] ) ? $finish['label'] : ucfirst( $key ) ),
				'roughness' => self::clamp01( isset( $finish['roughness'] ) ? $finish['roughness'] : 0.5 ),
				'metalness' => self::clamp01( isset( $finish['metalness'] ) ? $finish['metalness'] : 0.0 ),
			);
		}
		if ( empty( $out['finishes'] ) ) {
			$out['finishes'] = self::default_finishes();
		}

		$out['finish_order'] = array();
		if ( isset( $input['finish_order'] ) && is_array( $input['finish_order'] ) ) {
			foreach ( $input['finish_order'] as $key ) {
				$key = sanitize_key( $key );
				if ( isset( $out['finishes'][ $key ] ) ) {
					$out['finish_order'][] = $key;
				}
			}
		}
		if ( empty( $out['finish_order'] ) ) {
			$out['finish_order'] = array_keys( $out['finishes'] );
		}

		$default_finish        = isset( $input['default_finish'] ) ? sanitize_key( $input['default_finish'] ) : '';
		$out['default_finish'] = isset( $out['finishes'][ $default_finish ] ) ? $default_finish : $out['finish_order'][0];

		$bg = isset( $input['background'] ) ? (string) $input['background'] : 'transparent';
		if ( 'transparent' === $bg ) {
			$out['background'] = 'transparent';
		} else {
			$out['background'] = self::sanitize_hex( $bg ) ? self::sanitize_hex( $bg ) : 'transparent';
		}

		return $out;
	}

	/**
	 * Validate a #rrggbb colour.
	 *
	 * @param string $hex Candidate.
	 * @return string|null
	 */
	public static function sanitize_hex( $hex ) {
		$hex = is_string( $hex ) ? trim( $hex ) : '';
		if ( preg_match( '/^#([0-9a-fA-F]{6})$/', $hex ) ) {
			return strtolower( $hex );
		}
		return null;
	}

	/**
	 * Clamp a value to the 0..1 range.
	 *
	 * @param mixed $v Value.
	 * @return float
	 */
	public static function clamp01( $v ) {
		$v = (float) $v;
		return max( 0.0, min( 1.0, $v ) );
	}
}
