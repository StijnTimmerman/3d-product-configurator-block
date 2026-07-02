<?php
/**
 * Block registration + front-end runtime data.
 *
 * @package SteilConfigurator
 */

namespace SteilConfigurator;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Registers the configurator block and exposes runtime config to its view script.
 */
class Block {

	/**
	 * Hook registration.
	 */
	public function register() {
		add_action( 'init', array( $this, 'register_block' ) );
	}

	/**
	 * Register the block from the build directory.
	 */
	public function register_block() {
		$dir = STEIL_CFG_DIR . 'build/configurator';
		if ( ! file_exists( $dir . '/block.json' ) ) {
			return;
		}

		register_block_type( $dir );

		// Expose REST root + nonce + strings to the view script.
		$handles = generate_block_asset_handle( 'steil/configurator', 'viewScript' );
		if ( wp_script_is( $handles, 'registered' ) ) {
			wp_localize_script(
				$handles,
				'steilCfgRuntime',
				array(
					'rest'  => esc_url_raw( rest_url( REST::NAMESPACE . '/' ) ),
					'nonce' => wp_create_nonce( 'wp_rest' ),
					'i18n'  => array(
						'finish'        => __( 'Finish', 'steil-3d-configurator' ),
						'reset'         => __( 'Reset', 'steil-3d-configurator' ),
						'requestQuote'  => __( 'Request a quote', 'steil-3d-configurator' ),
						'name'          => __( 'Name', 'steil-3d-configurator' ),
						'email'         => __( 'Email', 'steil-3d-configurator' ),
						'message'       => __( 'Message (optional)', 'steil-3d-configurator' ),
						'send'          => __( 'Send request', 'steil-3d-configurator' ),
						'cancel'        => __( 'Cancel', 'steil-3d-configurator' ),
						'sending'       => __( 'Sending…', 'steil-3d-configurator' ),
						'thanks'        => __( 'Thanks! We will get back to you soon.', 'steil-3d-configurator' ),
						'error'         => __( 'Something went wrong. Please try again.', 'steil-3d-configurator' ),
						'loading'       => __( 'Loading 3D model…', 'steil-3d-configurator' ),
						'loadError'     => __( 'The 3D model could not be loaded.', 'steil-3d-configurator' ),
						'yourSelection' => __( 'Your selection', 'steil-3d-configurator' ),
						'notIncluded'   => __( 'Not included', 'steil-3d-configurator' ),
					),
				)
			);
		}
	}
}
