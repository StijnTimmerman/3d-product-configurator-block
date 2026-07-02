<?php
/**
 * Plugin Name:       Steil 3D Configurator
 * Description:       Show an interactive 3D product, let visitors choose colours per part and a finish, and request a quote. Upload your own GLB or FBX model.
 * Version:           1.0.1
 * Requires at least: 6.5
 * Requires PHP:      7.4
 * Author:            Steil Digital
 * Author URI:        https://steildigital.nl
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       steil-3d-configurator
 * Domain Path:       /languages
 *
 * @package SteilConfigurator
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // No direct access.
}

define( 'STEIL_CFG_VERSION', '1.0.1' );
define( 'STEIL_CFG_FILE', __FILE__ );
define( 'STEIL_CFG_DIR', plugin_dir_path( __FILE__ ) );
define( 'STEIL_CFG_URL', plugin_dir_url( __FILE__ ) );

require_once STEIL_CFG_DIR . 'includes/class-product-cpt.php';
require_once STEIL_CFG_DIR . 'includes/class-product-store.php';
require_once STEIL_CFG_DIR . 'includes/class-rest.php';
require_once STEIL_CFG_DIR . 'includes/class-quote.php';
require_once STEIL_CFG_DIR . 'includes/class-assets.php';
require_once STEIL_CFG_DIR . 'includes/class-block.php';
require_once STEIL_CFG_DIR . 'includes/class-plugin.php';

/**
 * Boot the plugin.
 */
function steil_cfg() {
	static $plugin = null;
	if ( null === $plugin ) {
		$plugin = new \SteilConfigurator\Plugin();
		$plugin->init();
	}
	return $plugin;
}
add_action( 'plugins_loaded', 'steil_cfg' );

// Create the bundled sample product on activation.
register_activation_hook( __FILE__, array( '\SteilConfigurator\Product_CPT', 'activate' ) );
