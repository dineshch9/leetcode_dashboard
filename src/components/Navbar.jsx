import { Box, Container, Flex, Input, Button, Heading, useToast, ButtonGroup } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaSearch, FaTrophy, FaChartBar } from 'react-icons/fa';

function Navbar() {
  const navigate = useNavigate();

  return (
    <Box bg="white" boxShadow="sm" position="sticky" top={0} zIndex={1}>
      <Container maxW="container.xl">
        <Flex py={4} justify="center" align="center">
          <Heading
            as="h1"
            size="lg"
            cursor="pointer"
            onClick={() => navigate('/')}
          >
            LeetCode Performance Tracker
          </Heading>
        </Flex>
      </Container>
    </Box>
  );
}

export default Navbar;