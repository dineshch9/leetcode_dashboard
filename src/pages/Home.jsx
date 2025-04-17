import { Box, Heading, Text, VStack, Input, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUpload } from 'react-icons/fa';

function Home() {
  const navigate = useNavigate();
  const toast = useToast();

  const handleFileUpload = () => {
    navigate('/contest');
  };

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="center"
      minH="calc(100vh - 200px)"
    >
      <VStack spacing={8} textAlign="center">
        <Heading size="2xl">LeetCode Profile Viewer</Heading>
        <Text fontSize="xl" color="gray.600">
          Upload an Excel file to view LeetCode contest rankings
        </Text>
        <Box w="100%" maxW="500px">
          <VStack spacing={4}>
            <Input
              type="button"
              size="lg"
              value="Upload Excel File"
              onClick={handleFileUpload}
              cursor="pointer"
              _hover={{ bg: 'blue.50' }}
              leftIcon={<FaUpload />}
            />
          </VStack>
        </Box>
      </VStack>
    </Box>
  );
}

export default Home;