/**
 * @fileoverview Provide zz.routers.events.Routed.
 * @license Apache-2.0
 * @author buntarb@gmail.com (Artem Lytvynov)
 */

goog.provide( 'zz.routers.events.Routed' );
goog.require( 'zz.routers.enums.EventType' );
goog.require( 'zz.events.BaseEvent' );

/**
 * Routed event class.
 * @param {String} prev
 * @param {String} curr
 * @extends {zz.events.BaseEvent}
 * @constructor
 */
zz.routers.events.Routed = function( prev, curr ){

	zz.events.BaseEvent.call( this, zz.routers.enums.EventType.ROUTED );

	/**
	 * Previous fragment.
	 * @type {String}
	 * @private
	 */
	this.prev_ = prev;

	/**
	 * Current fragment.
	 * @type {String}
	 * @private
	 */
	this.curr_ = curr;
};
goog.inherits( zz.routers.events.Routed, zz.events.BaseEvent );

/**
 * Return previous fragment.
 * @returns {String}
 */
zz.routers.events.Routed.prototype.getPrevFragment = function( ){

	return this.prev_;
};

/**
 * Return current fragment.
 * @returns {String}
 */
zz.routers.events.Routed.prototype.getCurrFragment = function( ){

	return this.curr_;
};