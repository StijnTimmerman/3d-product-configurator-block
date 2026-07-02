=== Steil 3D Configurator ===
Contributors: stijntimmerman
Tags: 3d, configurator, gutenberg, block, product
Requires at least: 6.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.1
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Show an interactive 3D product on any page. Visitors pick colours per part and a finish, then request a quote. Upload your own GLB or FBX model.

== Description ==

Steil 3D Configurator adds a Gutenberg block that shows an interactive 3D product. Visitors can rotate the model, pick a colour per part and a finish, and send a quote request with their configuration (including a screenshot of what they built).

Everything is editable from the WordPress admin:

* **Configurator products** — a Custom Post Type. Upload a glTF/GLB or FBX model, let the editor detect its parts, and assign a colour palette, finishes and defaults to each. Reuse the same product across many pages.
* **The block** — pick a product, set the height, choose where the controls sit, and toggle the finish selector, reset button and quote form.

Built on [Three.js](https://threejs.org). Works with classic and block (FSE) themes; styles are scoped so they don't clash with your theme. No external services or CDNs — everything is bundled locally.

A sample "Lounge chair" product is created on activation so you can try the block immediately.

== Installation ==

1. Upload the plugin zip via *Plugins → Add New → Upload Plugin*, or copy the folder to `wp-content/plugins/`.
2. Activate it. A sample configurator product is created automatically.
3. Go to *3D Configurator* to create your own product: upload a model (GLB or FBX), click "Detect parts from model", and assign palettes.
4. Add the **Steil 3D Configurator** block to any page and pick your product.

== Frequently Asked Questions ==

= What model formats are supported? =
glTF/GLB 2.0 and FBX. GLB (a single binary file) is recommended for the smallest, most portable models.

= How does part recolouring work? =
Each "part" has one or more match terms. Any mesh or material whose name contains a match term is recoloured with that part's palette. Use "Detect parts from model" to see the available names.

= Where do quote requests go? =
To the site admin email by default. Use the `steil_cfg_quote_recipient` filter to change it.

== Screenshots ==

1. The configurator on the front end: rotate the product, pick a colour per part and a finish.
2. The product editor in the WordPress admin, with a live 3D preview and part-to-palette mapping.

== Changelog ==

= 1.0.1 =
* New custom 3D-cube block icon in the editor, replacing the generic art icon.

= 1.0.0 =
* Initial release: configurator block, glTF/GLB + FBX upload, part mapping, palettes, finishes, quote request with screenshot, bundled sample product.

== Upgrade Notice ==

= 1.0.1 =
Fresh block icon; no functional changes.

= 1.0.0 =
First release.
