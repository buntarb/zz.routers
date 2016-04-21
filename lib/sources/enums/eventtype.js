/**
 * @fileoverview Provide zz.routers.enums.EventType.
 * @license Apache-2.0
 * @author buntarb@gmail.com (Artem Lytvynov)
 */

goog.provide( 'zz.routers.enums.EventType' );
goog.require( 'goog.events' );

/**
 * Event types names for router.
 * @enum {string}
 */
zz.routers.enums.EventType = {

	ROUTED: goog.events.getUniqueId( 'routed' )
};