#!/usr/bin/env perl

use strict;
use warnings;
use 5.014;
use utf8;

use File::Slurp qw(read_file);
use Mojolicious::Lite;
use Storable qw(retrieve);

our $VERSION = '0.00';
my $locations = {};

sub slurp {
	my ($file) = @_;

	return read_file($file, err_mode => 'quiet');
}

sub overview {
	my ($self) = @_;

	$locations = retrieve('locations.db') // {};

	$self->render(
		'overview',
		version => $VERSION,
	);
	return;
}

helper door_status => sub {
	my ($self) = @_;

	my $raw = slurp('/srv/www/door.status');
	given ($raw) {
		when (1) { return 'open' }
		when (0) { return 'closed' }
		default { return 'unknown' }
	}
};

helper light_ro => sub {
	my ($self, $light) = @_;
	my $state = -1;
	my $image = 'light.png';

	given ($light) {
		when ('outdoor') { $state = slurp('/srv/www/light-door.status') }
	}

	given ($state) {
		when ('1') { $image = 'light_on.png' }
		when ('0') { $image = 'light_off.png' }
	}

	return sprintf('<img src="%s" class="light ro %s" title="%s" />',
		$image,
		$light, $light
	);
};

helper has_location => sub {
	my ($self, $location) = @_;

	my $ret = q{};
	my $prefix = 'http://wiki.chaosdorf.de/Special:URIResolver/';

	for my $item (@{ $locations->{"${prefix}${location}"} // [] } ) {
		my ($name) = ($item =~ m{ ^ $prefix (.*) $ }x);
		$ret .= sprintf("<li><a href=\"%s\">%s</a></li>\n",
			$item, $name );
	}

	return $ret;
};

helper muninlink => sub {
	my ($self, $plugin, $name) = @_;

	return sprintf('<a href="https://intern.chaosdorf.de/munin/chaosdorf.dn42/figurehead.chaosdorf.dn42/%s.html">%s</a>',
		$plugin, $name // $plugin);
};

helper sunrise => sub {
	return slurp('/srv/www/sunrise');
};

helper sunset => sub{
	return slurp('/srv/www/sunset');
};

helper wikilink => sub {
	my ($self, $site) = @_;
	my $name = $site;
	my $image = undef;

	if ($name =~ s{ ^ Host : }{}ox) {
		$image = 'host.png';
	}

	return sprintf('%s<a href="https://wiki.chaosdorf.de/%s">%s</a>',
		$image ? "<img src=\"$image\" />" : q{},
		$site, $name);
};

get '/' => \&overview;

app->config(
	hypnotoad => {
		listen   => ['http://127.0.0.1:8081'],
		pid_file => '/tmp/dorfmap.pid',
		workers  => 2,
	},
);
app->defaults( layout => 'default' );

app->start;
